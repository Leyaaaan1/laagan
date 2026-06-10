// frontend/React/hooks/useRideLocationPolling.js
//
// OPTIMIZATION: Dual-threshold polling strategy
//
// The hook now tracks the device's last sent position and avoids the
// expensive shareLocationAndFetchAll() call when the rider hasn't moved.
// On a skip it falls back to a GET-only fetch so other riders' positions
// still update.  A hard ceiling (MAX_SKIP_COUNT or MAX_SKIP_MS) forces a
// full upload even when the rider is idle, preventing permanent stale data.

import {useEffect, useRef, useState, useCallback} from 'react';
import {AppState, Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import {
  getCurrentPosition,
  shareLocationAndFetchAll,
  fetchAllLocations,
  calculateBackoffDelay,
  shouldRetryError,
  isFatalError,
  isAuthError,
  createIntervalManager,
  createTimeoutManager,
  createPollLock,
} from '../services/locationPollingService';
import {useAuth} from '../context/AuthContext';

// ─── tuneable constants ────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 8_000; // regular polling cadence
const MOVEMENT_THRESHOLD_M = 15; // skip upload below this distance
const MAX_SKIP_COUNT = 3; // force upload after N consecutive skips
const MAX_SKIP_MS = 30_000; // …or after this many ms since last upload
//                                          (whichever fires first)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Haversine formula — returns distance in metres between two lat/lng pairs.
 * Cheap enough to run on every poll tick without impacting battery.
 */
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6_371_000; // Earth radius in metres
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ─── useLocationPermission ────────────────────────────────────────────────

export const useLocationPermission = () => {
  const [granted, setGranted] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const requestPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message:
                'This app needs access to your location to share it during rides.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );
          setGranted(result === PermissionsAndroid.RESULTS.GRANTED);
        } else {
          await Geolocation.requestAuthorization('whenInUse');
          setGranted(true);
        }
      } catch (err) {
        console.warn('Location permission error:', err);
        setGranted(false);
      } finally {
        setChecked(true);
      }
    };

    requestPermission();
  }, []);

  return {granted, checked};
};

// ─── useRideLocationPolling ────────────────────────────────────────────────

export const useRideLocationPolling = ({
  rideId,
  enabled = true,
  onLocationsUpdate,
  onError,
}) => {
  const {token} = useAuth();

  // ── exposed state ────────────────────────────────────────────────────────
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [nextRetryDelay, setNextRetryDelay] = useState(1000);
  const [isOffline, setIsOffline] = useState(false);

  // ── infrastructure refs (stable across renders) ──────────────────────────
  const intervalManager = useRef(createIntervalManager());
  const timeoutManager = useRef(createTimeoutManager());
  const pollLock = useRef(createPollLock());

  // ── mutable state refs (readable inside async callbacks without stale closure) ─
  const retryCountRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  const enabledRef = useRef(enabled);
  const isPollingRef = useRef(false);
  const isOfflineRef = useRef(false);
  const tokenRef = useRef(token);
  const jitterTimeoutRef = useRef(null);

  // ── movement-tracking refs ───────────────────────────────────────────────
  /**
   * lastSentPosition: the coords of the most recent successful HTTP upload.
   * Intentionally NOT reset on stopPolling so the distance check still works
   * when polling resumes after backgrounding or network reconnect.
   * Set to null only on hook unmount or when rideId changes.
   */
  const lastSentPositionRef = useRef(null); // {latitude, longitude}

  /**
   * consecutiveSkipCount: how many consecutive poll ticks were skipped because
   * the rider hadn't moved enough.  Resets to 0 after every real HTTP upload.
   */
  const consecutiveSkipCountRef = useRef(0);

  /**
   * lastUploadTimestampRef: Date.now() of the last successful upload.
   * Used for the time-based forced-refresh ceiling (MAX_SKIP_MS).
   */
  const lastUploadTimestampRef = useRef(null);

  /**
   * isFirstPollRef: guards the very first poll so it always does a full upload
   * regardless of distance, then is set to false for the lifetime of the hook.
   */
  const isFirstPollRef = useRef(true);

  // ── sync mutable refs to latest prop/state values ────────────────────────
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    isOfflineRef.current = isOffline;
  }, [isOffline]);
  useEffect(() => {
    tokenRef.current = token;
    console.log(
      '🔐 Auth token updated:',
      token ? '✅ Available' : '❌ Missing',
    );
  }, [token]);

  // ── reset position tracking when ride changes ────────────────────────────
  useEffect(() => {
    lastSentPositionRef.current = null;
    consecutiveSkipCountRef.current = 0;
    lastUploadTimestampRef.current = null;
    isFirstPollRef.current = true;
    console.log('🗺️ Ride changed — position tracking reset');
  }, [rideId]);

  // =========================================================================
  // ERROR HANDLER
  // =========================================================================
  const handlePollingError = useCallback(
    err => {
      if (err.message === 'APP_BACKGROUNDED') {
        console.log('📵 Poll skipped — app is backgrounded');
        return;
      }

      retryCountRef.current += 1;
      const count = retryCountRef.current;

      if (isFatalError(err)) {
        console.error('⛔ Fatal error (no retry):', err.message);
        setError(`Fatal: ${err.message}`);
        setIsPolling(false);
        isPollingRef.current = false;
        onError?.(err);
        return;
      }

      if (isAuthError(err)) {
        setIsPolling(false);
        isPollingRef.current = false;
        setError(err.message);
        onError?.(err);
        return;
      }

      if (shouldRetryError(count)) {
        const nextDelay = calculateBackoffDelay(count);
        setRetryCount(count);
        setNextRetryDelay(nextDelay);
        setError(`Retry ${count}/3…`);
        timeoutManager.current.set(() => pollOnceRef.current(), nextDelay);
      } else {
        setError(`Failed after 3 retries: ${err.message}`);
        setIsPolling(false);
        isPollingRef.current = false;
        onError?.(err);
      }
    },
    [onError],
  );

  // =========================================================================
  // CORE POLL FUNCTION
  // =========================================================================
  const pollOnceRef = useRef(null);

  const pollLocationOnce = useCallback(async () => {
    if (!pollLock.current.acquire()) return;

    try {
      if (!tokenRef.current) {
        throw new Error('AUTH_MISSING - No access token available');
      }

      const {latitude, longitude} = await getCurrentPosition();

      // ── movement check ──────────────────────────────────────────────────
      const isFirst = isFirstPollRef.current;
      const lastPos = lastSentPositionRef.current;
      const skipCount = consecutiveSkipCountRef.current;
      const lastUpload = lastUploadTimestampRef.current;

      const distanceMoved = lastPos
        ? haversineMeters(
            lastPos.latitude,
            lastPos.longitude,
            latitude,
            longitude,
          )
        : Infinity; // no previous position → treat as "moved"

      const timeElapsedMs = lastUpload ? Date.now() - lastUpload : Infinity;

      const hasMovedEnough = distanceMoved >= MOVEMENT_THRESHOLD_M;
      const skipLimitHit = skipCount >= MAX_SKIP_COUNT;
      const timeLimitHit = timeElapsedMs >= MAX_SKIP_MS;
      const mustUpload =
        isFirst || hasMovedEnough || skipLimitHit || timeLimitHit;

      console.log('📍 Poll tick', {
        distanceMoved:
          distanceMoved === Infinity ? 'n/a' : `${distanceMoved.toFixed(1)}m`,
        timeElapsedMs:
          timeElapsedMs === Infinity ? 'n/a' : `${timeElapsedMs}ms`,
        consecutiveSkipCount: skipCount,
        mustUpload,
        reason: isFirst
          ? 'first_poll'
          : hasMovedEnough
          ? 'movement'
          : skipLimitHit
          ? 'skip_count_ceiling'
          : timeLimitHit
          ? 'time_ceiling'
          : 'skip',
      });

      // ── branch: skip upload, fetch-only ────────────────────────────────
      if (!mustUpload) {
        consecutiveSkipCountRef.current += 1;
        console.log(
          `⏭️ Upload skipped (moved ${distanceMoved.toFixed(
            1,
          )}m) — fetching others only`,
          `[skip ${consecutiveSkipCountRef.current}/${MAX_SKIP_COUNT}]`,
        );

        // Still refresh the map so other riders' positions update
        const allLocations = await fetchAllLocations(rideId);
        _handleLocationsResponse(allLocations);
        return;
      }

      // ── branch: full upload + fetch ─────────────────────────────────────
      isFirstPollRef.current = false;

      console.log('📤 Uploading location + fetching all riders');
      const allLocations = await shareLocationAndFetchAll(
        rideId,
        latitude,
        longitude,
      );

      // ✅ On success: update position tracking
      lastSentPositionRef.current = {latitude, longitude};
      consecutiveSkipCountRef.current = 0;
      lastUploadTimestampRef.current = Date.now();

      _handleLocationsResponse(allLocations);
    } catch (err) {
      console.error('❌ Poll error:', err.message);
      handlePollingError(err);
    } finally {
      pollLock.current.release();
    }
  }, [rideId, handlePollingError, onLocationsUpdate]); // eslint-disable-line

  /**
   * Shared response normalisation used by both the upload and skip paths.
   * Extracted to avoid duplicating the null-guard and success-state resets.
   */
  function _handleLocationsResponse(allLocations) {
    if (!allLocations || !Array.isArray(allLocations)) {
      console.warn(
        '⚠️ Invalid locations response:',
        allLocations,
        '— using empty array',
      );
      retryCountRef.current = 0;
      setRetryCount(0);
      setNextRetryDelay(1000);
      setError(null);
      onLocationsUpdate?.([]);
      return;
    }

    console.log('✅ Locations received:', allLocations.length, 'participants');
    retryCountRef.current = 0;
    setRetryCount(0);
    setNextRetryDelay(1000);
    setError(null);
    onLocationsUpdate?.(allLocations);
  }

  useEffect(() => {
    pollOnceRef.current = pollLocationOnce;
  }, [pollLocationOnce]);

  // =========================================================================
  // START / STOP
  // =========================================================================
  const stopPolling = useCallback(() => {
    if (jitterTimeoutRef.current) {
      clearTimeout(jitterTimeoutRef.current);
      jitterTimeoutRef.current = null;
    }
    intervalManager.current.stop();
    timeoutManager.current.clear();
    setIsPolling(false);
    isPollingRef.current = false;
    // NOTE: intentionally do NOT reset lastSentPositionRef here.
    // When polling resumes (foreground / reconnect) we still want the
    // distance comparison against the last known uploaded position.
  }, []);

  const startPolling = useCallback(() => {
    if (intervalManager.current.isRunning()) return;

    setIsPolling(true);
    isPollingRef.current = true;
    setError(null);

    // Force an immediate upload on resume so we don't wait up to 8s
    // for the first tick.  Reset the skip counter so the forced-refresh
    // ceiling is measured from this point, not from before backgrounding.
    consecutiveSkipCountRef.current = 0;
    // Do NOT reset lastSentPositionRef — see note in stopPolling above.

    pollOnceRef.current();

    const jitter = Math.floor(Math.random() * 2000);
    jitterTimeoutRef.current = setTimeout(() => {
      jitterTimeoutRef.current = null;
      intervalManager.current.start(
        () => pollOnceRef.current(),
        POLL_INTERVAL_MS,
      );
    }, jitter);
  }, []);

  // =========================================================================
  // NETWORK LISTENER
  // =========================================================================
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('📡 Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });

      if (!state.isConnected) {
        stopPolling();
        setIsOffline(true);
      } else if (state.isConnected && isOfflineRef.current) {
        retryCountRef.current = 0;
        setRetryCount(0);
        setError(null);
        setIsOffline(false);

        if (enabledRef.current && rideId) {
          startPolling();
        }
      }
    });

    return () => unsubscribe();
  }, [rideId, stopPolling, startPolling]);

  // =========================================================================
  // ENABLED / RIDE CHANGE EFFECT
  // =========================================================================
  useEffect(() => {
    if (enabled && rideId && AppState.currentState === 'active') {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [enabled, rideId, startPolling, stopPolling]);

  // =========================================================================
  // APP STATE LISTENER (background / foreground)
  // =========================================================================
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      const isNowActive = nextState === 'active';
      const isNowBackground = nextState.match(/inactive|background/);

      if (wasBackground && isNowActive) {
        console.log('📲 App foregrounded — resuming polling');
        if (enabledRef.current && !isPollingRef.current && tokenRef.current) {
          // startPolling() already resets consecutiveSkipCount and does an
          // immediate poll, so map data is never stale after foreground resume.
          startPolling();
        }
      } else if (isNowBackground) {
        console.log('📲 App backgrounded — pausing polling');
        stopPolling();
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [startPolling, stopPolling]);

  // =========================================================================
  // CLEANUP
  // =========================================================================
  useEffect(() => {
    const interval = intervalManager.current;
    const timeout = timeoutManager.current;

    return () => {
      interval.clear();
      timeout.clear();
      console.log('🧹 Location polling cleanup completed');
    };
  }, []);

  return {isPolling, error, retryCount, nextRetryDelay, isOffline};
};
