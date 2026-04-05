import {useEffect, useRef, useState, useCallback} from 'react';
import {AppState} from 'react-native';
import {BASE_URL} from '@env';
import Geolocation from '@react-native-community/geolocation';
import {Platform, PermissionsAndroid} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const API_BASE_URL = BASE_URL || 'http://localhost:8080';
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
          // iOS
          const auth = await Geolocation.requestAuthorization('whenInUse');
          setGranted(auth === 'granted');
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

// ─────────────────────────────────────────────────────────────────
// RIDE LOCATION POLLING HOOK
// ─────────────────────────────────────────────────────────────────

export const useRideLocationPolling = ({
  rideId,
  token,
  enabled = true,
  onLocationsUpdate,
  onError,
}) => {
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [nextRetryDelay, setNextRetryDelay] = useState(1000);
  const [isOffline, setIsOffline] = useState(false);

  const retryCountRef = useRef(0);
  const pollIntervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const enabledRef = useRef(enabled);
  const isPollingRef = useRef(false);
  const isPollInFlightRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  // ─────────────────────────────────────────────────────────────────
  // 1. GET CURRENT GPS POSITION
  // ─────────────────────────────────────────────────────────────────
  const getCurrentPosition = useCallback(() => {
    return new Promise(async (resolve, reject) => {
      // Check permission before calling GPS
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (!granted) {
          reject(new Error('Location permission not granted'));
          return;
        }
      }

      // Stage 1: try high-accuracy GPS with a generous timeout.
      // maximumAge: 10000 allows a cached fix up to 10 s old — avoids
      // forcing a brand-new satellite fix on every 5-second poll cycle,
      // which is the primary cause of the timeout loop.
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Stage 2: GPS timed out — fall back to network/cell location.
          // Lower accuracy is acceptable; it's better than failing the poll.
          Geolocation.getCurrentPosition(
            position => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            err => {
              reject(new Error(`GPS Error (${err.code}): ${err.message}`));
            },
            {
              enableHighAccuracy: false, // network / cell tower location
              timeout: 10000,
              maximumAge: 30000, // accept a fix up to 30 s old
            },
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 45000, // cold GPS on Android can need 25–45 s
          maximumAge: 10000, // reuse a fix that is less than 10 s old
          forceRequestLocation: true,
          showLocationDialog: true,
        },
      );
    });
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('📡 Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });

      if (!state.isConnected) {
        // Network disconnected
        console.log('❌ Network disconnected — pausing polling');
        stopPolling();
        setIsOffline(true);
      } else if (state.isConnected && isOffline) {
        // Network reconnected and was previously offline
        console.log('✅ Network reconnected — resuming polling');
        retryCountRef.current = 0; // Reset retry state
        setRetryCount(0);
        setError(null);
        setIsOffline(false);
        // Resume polling if enabled
        if (enabledRef.current && rideId && token) {
          startPolling();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOffline, rideId, token]);

  // ─────────────────────────────────────────────────────────────────
  // 2. SINGLE POLL CYCLE — share own location, receive all locations
  // ─────────────────────────────────────────────────────────────────
  const handlePollingError = useCallback(
    err => {
      const MAX_RETRIES = 3;
      const MAX_DELAY = 30000;

      retryCountRef.current += 1;
      const count = retryCountRef.current;
      const nextDelay = Math.min(Math.pow(2, count - 1) * 1000, MAX_DELAY);

      setRetryCount(count);
      setNextRetryDelay(nextDelay);

      if (count <= MAX_RETRIES) {
        setError(`Retry ${count}/${MAX_RETRIES}…`);
        retryTimeoutRef.current = setTimeout(() => {
          pollOnceRef.current();
        }, nextDelay);
      } else {
        setError(`Failed after ${MAX_RETRIES} retries: ${err.message}`);
        setIsPolling(false);
        isPollingRef.current = false;
        if (onError) onError(err);
      }
    },
    [onError],
  );

  // Store pollLocationOnce in a ref so handlePollingError can call it
  // without creating a circular dependency
  const pollOnceRef = useRef(null);

  const pollLocationOnce = useCallback(async () => {
    if (isPollInFlightRef.current) {
      console.log('⏭️ Poll skipped — previous poll still in flight');
      return;
    }
    isPollInFlightRef.current = true;
    try {
      const {latitude, longitude} = await getCurrentPosition();
      console.log('📍 Sharing location:', {latitude, longitude, rideId});

      const response = await fetch(
        `${API_BASE_URL}/location/${rideId}/share?latitude=${latitude}&longitude=${longitude}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // ✅ NEW: Check for 401/403 BEFORE throwing a generic error
      if (response.status === 401 || response.status === 403) {
        console.error('⚠️ Token expired (HTTP', response.status + ')');
        setIsPolling(false);
        isPollingRef.current = false;
        const sessionExpiredError = new Error(
          'Session expired. Please log in again.',
        );
        setError(sessionExpiredError.message);
        if (onError) onError(sessionExpiredError);
        return; // Stop polling — do NOT retry
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // The backend returns ALL riders' latest locations in one shot —
      // this is what gets rendered as markers on the map.
      const allLocations = await response.json();

      console.log('✅ Locations received:', allLocations.length);
      allLocations.forEach(loc =>
        console.log(
          `  ${loc.initiator}: [${loc.latitude}, ${loc.longitude}] @ ${loc.locationName}`,
        ),
      );

      // Reset backoff state on success
      retryCountRef.current = 0;
      setRetryCount(0);
      setNextRetryDelay(1000);
      setError(null);

      if (onLocationsUpdate) onLocationsUpdate(allLocations);
    } catch (err) {
      console.error('❌ Poll error:', err.message);
      handlePollingError(err);
    } finally {
      isPollInFlightRef.current = false;
    }
  }, [
    rideId,
    token,
    getCurrentPosition,
    onLocationsUpdate,
    handlePollingError,
  ]);

  // Keep the ref up to date so the retry timeout always calls the latest version
  useEffect(() => {
    pollOnceRef.current = pollLocationOnce;
  }, [pollLocationOnce]);

  // ─────────────────────────────────────────────────────────────────
  // 3. START / STOP POLLING
  // ─────────────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setIsPolling(false);
    isPollingRef.current = false;
  }, []);

  const startPolling = useCallback(() => {
    // Guard: don't start a second interval if one is already running
    if (pollIntervalRef.current) return;

    setIsPolling(true);
    isPollingRef.current = true;
    setError(null);

    // Immediate first poll so the map isn't blank for 5 seconds
    pollOnceRef.current();

    // Repeat every 8 seconds
    pollIntervalRef.current = setInterval(() => {
      pollOnceRef.current();
    }, 8000);

    console.log('🟢 Location polling started for ride', rideId);
  }, [rideId]);

  // ─────────────────────────────────────────────────────────────────
  // 4. MAIN LIFECYCLE — start/stop when enabled or rideId/token change
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (enabled && rideId && token) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling(); // cleanup on unmount
  }, [enabled, rideId, token, startPolling, stopPolling]);

  // ─────────────────────────────────────────────────────────────────
  // 5. PAUSE ON BACKGROUND / RESUME ON FOREGROUND
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      const isNowActive = nextState === 'active';
      const isNowBackground = nextState.match(/inactive|background/);

      if (wasBackground && isNowActive) {
        console.log('📲 App foregrounded — resuming polling');
        if (enabledRef.current && !isPollingRef.current) startPolling();
      } else if (isNowBackground) {
        console.log('📲 App backgrounded — pausing polling');
        stopPolling();
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [startPolling, stopPolling]);

  return {isPolling, error, retryCount, nextRetryDelay, isOffline};
};
