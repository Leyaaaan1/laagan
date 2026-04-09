import {useEffect, useRef, useState, useCallback} from 'react';
import {AppState, Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import {
  getCurrentPosition,
  shareLocationAndFetchAll,
  calculateBackoffDelay,
  shouldRetry,
  isAuthError,
  createIntervalManager,
  createTimeoutManager,
  createPollLock,
} from '../services/locationPollingService';

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

  const intervalManager = useRef(createIntervalManager());
  const timeoutManager = useRef(createTimeoutManager());
  const pollLock = useRef(createPollLock());

  const retryCountRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  const enabledRef = useRef(enabled);
  const isPollingRef = useRef(false);
  // ✅ NEW: Track offline state in a ref so effect doesn't re-subscribe on state changes
  const isOfflineRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // ✅ NEW: Keep isOfflineRef in sync with state
  useEffect(() => {
    isOfflineRef.current = isOffline;
  }, [isOffline]);

  const handlePollingError = useCallback(
    err => {
      retryCountRef.current += 1;
      const count = retryCountRef.current;

      // ✅ Auth errors should NOT retry
      if (isAuthError(err)) {
        setIsPolling(false);
        isPollingRef.current = false;
        setError(err.message);
        if (onError) {
          onError(err);
        }
        return;
      }

      // ✅ Check if should retry
      if (shouldRetry(count)) {
        const nextDelay = calculateBackoffDelay(count);
        setRetryCount(count);
        setNextRetryDelay(nextDelay);
        setError(`Retry ${count}/3…`);

        timeoutManager.current.set(() => {
          pollOnceRef.current();
        }, nextDelay);
      } else {
        // Max retries exceeded
        setError(`Failed after 3 retries: ${err.message}`);
        setIsPolling(false);
        isPollingRef.current = false;
        if (onError) {
          onError(err);
        }
      }
    },
    [onError],
  );

  const pollOnceRef = useRef(null);

  const pollLocationOnce = useCallback(async () => {
    if (!pollLock.current.acquire()) {
      return;
    }

    try {
      const {latitude, longitude} = await getCurrentPosition();

      const allLocations = await shareLocationAndFetchAll(
        rideId,
        latitude,
        longitude,
        token,
      );

      retryCountRef.current = 0;
      setRetryCount(0);
      setNextRetryDelay(1000);
      setError(null);

      if (onLocationsUpdate) {
        onLocationsUpdate(allLocations);
      }
    } catch (err) {
      console.error('❌ Poll error:', err.message);
      handlePollingError(err);
    } finally {
      pollLock.current.release();
    }
  }, [rideId, token, onLocationsUpdate, handlePollingError]);

  // Keep ref up to date
  useEffect(() => {
    pollOnceRef.current = pollLocationOnce;
  }, [pollLocationOnce]);

  const stopPolling = useCallback(() => {
    intervalManager.current.stop();
    timeoutManager.current.clear();
    setIsPolling(false);
    isPollingRef.current = false;
  }, []);

  const startPolling = useCallback(() => {
    if (intervalManager.current.isRunning()) {
      return;
    }

    setIsPolling(true);
    isPollingRef.current = true;
    setError(null);

    pollOnceRef.current();

    intervalManager.current.start(() => {
      pollOnceRef.current();
    }, 8000);
  }, []);

  // ✅ FIXED: NetInfo effect — only re-subscribes when rideId or token change, not isOffline
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('📡 Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });

      if (!state.isConnected) {
        // Network disconnected
        stopPolling();
        setIsOffline(true);
      } else if (state.isConnected && isOfflineRef.current) {
        // ✅ FIXED: Read from ref instead of state, so we don't need isOffline in deps
        // Network reconnected
        retryCountRef.current = 0;
        setRetryCount(0);
        setError(null);
        setIsOffline(false);

        if (enabledRef.current && rideId && token) {
          startPolling();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [rideId, token, stopPolling, startPolling]);
  // ✅ FIXED: Removed isOffline from deps — only re-subscribe when rideId or token change

  useEffect(() => {
    if (enabled && rideId && token) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [enabled, rideId, token, startPolling, stopPolling]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      const isNowActive = nextState === 'active';
      const isNowBackground = nextState.match(/inactive|background/);

      if (wasBackground && isNowActive) {
        console.log('📲 App foregrounded — resuming polling');
        if (enabledRef.current && !isPollingRef.current) {
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

  useEffect(() => {
    const interval = intervalManager.current;
    const timeout = timeoutManager.current;

    return () => {
      // ✅ Use captured locals instead of accessing refs directly
      interval.clear();
      timeout.clear();
      console.log('🧹 Location polling cleanup completed');
    };
  }, []);

  return {isPolling, error, retryCount, nextRetryDelay, isOffline};
};
