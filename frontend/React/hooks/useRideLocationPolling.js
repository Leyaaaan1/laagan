// frontend/React/hooks/useRideLocationPolling.js
//
// OPTIMIZATION: Dual-threshold polling strategy + SSE receive
//
// ARCHITECTURE:
//   SEND side  — setInterval still runs; device uploads its own GPS position
//                via shareLocationAndFetchAll() only when Haversine says it moved.
//   RECEIVE side — SSE (EventSource) listens for server-pushed location-update
//                events so other riders' markers refresh instantly without polling.
//                fetchAllLocations() is kept as the degraded fallback when SSE
//                is unavailable (e.g. no EventSource polyfill installed yet).

import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import EventSource from 'react-native-sse';
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
  saveRerouteCache,   // ← add
  loadRerouteCache,   // ← add
} from '../services/locationPollingService';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/Apiclient';

// ─── tuneable constants ────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 8_000;   // GPS read cadence (unchanged)
const MOVEMENT_THRESHOLD_M = 15;     // skip upload below this (unchanged)
const MAX_SKIP_COUNT = 10;      // ↑ raised: ~80s before forced heartbeat
const MAX_SKIP_MS = 120_000; // ↑ raised: 2 min heartbeat when idle
// ──────────────────────────────────────────────────────────────────────────

/**
 * Haversine formula — returns distance in metres between two lat/lng pairs.
 */
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6_371_000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const openLocationStream = (rideId, token, onLocations, onError) => {
  const url = `${API_BASE_URL}/location/${rideId}/stream`;
  console.log('[SSE] connecting to:', url);

  const es = new EventSource(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  es.addEventListener('open', () => {
    console.log('[SSE] connection OPEN');
  });

  es.addEventListener('location-update', event => {
    console.log('[SSE] location-update received:', event.data);
    try {
      const locations = JSON.parse(event.data);
      onLocations(locations);
    } catch (e) {
      console.log('[SSE] parse error:', e);
    }
  });

  es.addEventListener('error', err => {
    console.log('[SSE] error event:', JSON.stringify(err));
    onError?.(err);
  });

  return es;
};
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
        setGranted(false);
      } finally {
        setChecked(true);
      }
    };

    requestPermission();
  }, []);

  return { granted, checked };
};

// ─── useRideLocationPolling ────────────────────────────────────────────────

export const useRideLocationPolling = ({
  rideId,
  enabled = true,
  onLocationsUpdate,
  onReroute,
  onError,
}) => {
  const { token } = useAuth();

  // ── exposed state ────────────────────────────────────────────────────────
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [nextRetryDelay, setNextRetryDelay] = useState(1000);
  const [isOffline, setIsOffline] = useState(false);

  // ── infrastructure refs ───────────────────────────────────────────────────
  const intervalManager = useRef(createIntervalManager());
  const timeoutManager = useRef(createTimeoutManager());
  const pollLock = useRef(createPollLock());

  // ── SSE ref — holds the active EventSource (or null when closed/unavailable)
  const esRef = useRef(null);

  // ── mutable state refs ───────────────────────────────────────────────────
  const retryCountRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  const enabledRef = useRef(enabled);
  const isPollingRef = useRef(false);
  const isOfflineRef = useRef(false);
  const tokenRef = useRef(token);
  const jitterTimeoutRef = useRef(null);

  // ── movement-tracking refs ───────────────────────────────────────────────
  const lastSentPositionRef = useRef(null);
  const consecutiveSkipCountRef = useRef(0);
  const lastUploadTimestampRef = useRef(null);
  const isFirstPollRef = useRef(true);

  // ── sync mutable refs ─────────────────────────────────────────────────────
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    isOfflineRef.current = isOffline;
  }, [isOffline]);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // ── reset position tracking + close stale SSE when ride changes ──────────
  useEffect(() => {
    if (!rideId) return;
    let cancelled = false;

    (async () => {
      const cached = await loadRerouteCache(rideId);
      if (cached && !cancelled) {
        onReroute?.(cached);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rideId, onReroute]);

  useEffect(() => {
    lastSentPositionRef.current = null;
    consecutiveSkipCountRef.current = 0;
    lastUploadTimestampRef.current = null;
    isFirstPollRef.current = true;

    // Close any stream opened for the previous ride
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, [rideId]);

  // =========================================================================
  // HELPERS
  // =========================================================================

  const openStream = useCallback(() => {
    if (esRef.current) return;
    if (!tokenRef.current || !rideId) return;

    esRef.current = openLocationStream(
      rideId,
      tokenRef.current,
      locations => {
        _handleLocationsResponse(locations);
      },
      () => {
        esRef.current = null;
        if (isPollingRef.current && enabledRef.current && rideId) {
          setTimeout(() => {
            if (isPollingRef.current && enabledRef.current && rideId) openStream();
          }, 5_000);
        }
      },
    );
  }, [rideId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Close the SSE stream (receive side). */
  const closeStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  // =========================================================================
  // ERROR HANDLER
  // =========================================================================
  const handlePollingError = useCallback(
    err => {
      if (err.message === 'APP_BACKGROUNDED') {
        return;
      }

      retryCountRef.current += 1;
      const count = retryCountRef.current;

      if (isFatalError(err)) {
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
  // CORE POLL FUNCTION  (send side — uploads OUR position)
  // =========================================================================
  const pollOnceRef = useRef(null);

  const pollLocationOnce = useCallback(async () => {
    if (!pollLock.current.acquire()) return;

    try {
      if (!tokenRef.current) {
        throw new Error('AUTH_MISSING - No access token available');
      }

      const { latitude, longitude } = await getCurrentPosition();

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
        : Infinity;

      const timeElapsedMs = lastUpload ? Date.now() - lastUpload : Infinity;

      const hasMovedEnough = distanceMoved >= MOVEMENT_THRESHOLD_M;
      const skipLimitHit = skipCount >= MAX_SKIP_COUNT;
      const timeLimitHit = timeElapsedMs >= MAX_SKIP_MS;
      const mustUpload =
        isFirst || hasMovedEnough || skipLimitHit || timeLimitHit;

      // ── branch: skip upload ─────────────────────────────────────────────
      if (!mustUpload) {
        consecutiveSkipCountRef.current += 1;

        if (!esRef.current) {
          const allLocations = await fetchAllLocations(rideId);
          _handleLocationsResponse(allLocations);
        }
        return;
      }

      // ── branch: full upload + fetch ─────────────────────────────────────
      isFirstPollRef.current = false;

      // ── NEW: response is now { locations, reroute } not a bare array ────
      const { locations, reroute } = await shareLocationAndFetchAll(
        rideId,
        latitude,
        longitude,
      );

      lastSentPositionRef.current = { latitude, longitude };
      consecutiveSkipCountRef.current = 0;
      lastUploadTimestampRef.current = Date.now();

      // Locations update — same path as before, just using the extracted array.
      _handleLocationsResponse(locations);

      // ── NEW: personal reroute — only fires for this rider when off-route ─
      if (reroute?.rerouted && reroute.newRouteCoordinates) {
        onReroute?.(reroute.newRouteCoordinates);
        saveRerouteCache(rideId, reroute.newRouteCoordinates); // ← persist for next mount
      }
    } catch (err) {
      handlePollingError(err);
    } finally {
      pollLock.current.release();
    }
  }, [rideId, handlePollingError, onLocationsUpdate, onReroute]); // eslint-disable-line

  /**
   * Shared response normalisation used by both the upload and SSE event paths.
   */
  function _handleLocationsResponse(allLocations) {
    if (!allLocations || !Array.isArray(allLocations)) {
      retryCountRef.current = 0;
      setRetryCount(0);
      setNextRetryDelay(1000);
      setError(null);
      onLocationsUpdate?.([]);
      return;
    }

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

    // Close SSE receive stream
    closeStream();

    // NOTE: intentionally do NOT reset lastSentPositionRef here.
  }, [closeStream]);

  const startPolling = useCallback(() => {
    if (intervalManager.current.isRunning()) return;

    setIsPolling(true);
    isPollingRef.current = true;
    setError(null);

    consecutiveSkipCountRef.current = 0;
    // ── Reset isFirstPollRef so the first poll after any restart (foreground,
    // re-enable, network restore) always hits POST /share and gets the reroute
    // back from Redis — not just GET /all-riders which has no reroute data.
    isFirstPollRef.current = true;

    // Open SSE stream for the receive side first
    openStream();

    // Kick off an immediate upload tick
    pollOnceRef.current();

    const jitter = Math.floor(Math.random() * 2000);
    jitterTimeoutRef.current = setTimeout(() => {
      jitterTimeoutRef.current = null;
      intervalManager.current.start(
        () => pollOnceRef.current(),
        POLL_INTERVAL_MS,
      );
    }, jitter);
  }, [openStream]);

  // =========================================================================
  // NETWORK LISTENER
  // =========================================================================
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        stopPolling(); // also closes SSE via closeStream()
        setIsOffline(true);
      } else if (state.isConnected && isOfflineRef.current) {
        retryCountRef.current = 0;
        setRetryCount(0);
        setError(null);
        setIsOffline(false);

        if (enabledRef.current && rideId) {
          startPolling(); // also reopens SSE via openStream()
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
        if (enabledRef.current && rideId && !isPollingRef.current && tokenRef.current) {
          startPolling();
        }
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
      // Close SSE stream on unmount
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, []);

  return { isPolling, error, retryCount, nextRetryDelay, isOffline };
};