// ✅ FIXED: frontend/React/hooks/useRideLocationPolling.js

import {useEffect, useRef, useState, useCallback} from 'react';
import {AppState, Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import {
  getCurrentPosition,
  shareLocationAndFetchAll,
  calculateBackoffDelay,
  shouldRetry,
  shouldRetryError,
  isFatalError,
  isAuthError,
  createIntervalManager,
  createTimeoutManager,
  createPollLock,
} from '../services/locationPollingService';
import {useAuth} from '../context/AuthContext';

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

export const useRideLocationPolling = ({
  rideId,
  enabled = true,
  onLocationsUpdate,
  onError,
}) => {
  const {token} = useAuth();
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
  const isOfflineRef = useRef(false);
  const tokenRef = useRef(token);
  const jitterTimeoutRef = useRef(null);

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

  const handlePollingError = useCallback(
    err => {
      // App went to background mid-poll — not an error, just abort silently.
      // The AppState listener will resume polling when app is foregrounded.
      if (err.message === 'APP_BACKGROUNDED') {
        console.log('📵 Poll skipped — app is backgrounded');
        return; // no retry, no error state, no UI update
      }

      retryCountRef.current += 1;
      const count = retryCountRef.current;

      if (isFatalError(err)) {
        console.error('⛔ Fatal error (no retry):', err.message);
        setError(`Fatal: ${err.message}`);
        setIsPolling(false);
        isPollingRef.current = false;
        if (onError) {
          onError(err);
        }
        return;
      }

      if (isAuthError(err)) {
        setIsPolling(false);
        isPollingRef.current = false;
        setError(err.message);
        if (onError) {
          onError(err);
        }
        return;
      }

      if (shouldRetryError(count)) {
        const nextDelay = calculateBackoffDelay(count);
        setRetryCount(count);
        setNextRetryDelay(nextDelay);
        setError(`Retry ${count}/3…`);

        timeoutManager.current.set(() => {
          pollOnceRef.current();
        }, nextDelay);
      } else {
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
      // ✅ Check if token is available
      if (!tokenRef.current) {
        throw new Error('AUTH_MISSING - No access token available');
      }

      const {latitude, longitude} = await getCurrentPosition();

      console.log('📍 Location obtained, sharing:', {latitude, longitude});

      // ✅ FIX: Pass token as 4th parametconst startPolling = useCallbacker
      const allLocations = await shareLocationAndFetchAll(
        rideId,
        latitude,
        longitude,
      );
      // ✅ FIXED: Handle null/undefined response
      if (!allLocations || !Array.isArray(allLocations)) {
        console.warn(
          '⚠️ Invalid locations response:',
          allLocations,
          '— using empty array',
        );
        const emptyLocations = [];
        retryCountRef.current = 0;
        setRetryCount(0);
        setNextRetryDelay(1000);
        setError(null);

        if (onLocationsUpdate) {
          onLocationsUpdate(emptyLocations);
        }
        return;
      }

      console.log(
        '✅ Locations received:',
        allLocations.length,
        'participants',
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
  }, [rideId, handlePollingError, onLocationsUpdate]);

  useEffect(() => {
    pollOnceRef.current = pollLocationOnce;
  }, [pollLocationOnce]);

  const stopPolling = useCallback(() => {
    if (jitterTimeoutRef.current) {
      // ← cancel jitter if still pending
      clearTimeout(jitterTimeoutRef.current);
      jitterTimeoutRef.current = null;
    }
    intervalManager.current.stop();
    timeoutManager.current.clear();
    setIsPolling(false);
    isPollingRef.current = false;
  }, []);

  const startPolling = useCallback(() => {
    if (intervalManager.current.isRunning()) return;

    setIsPolling(true);
    isPollingRef.current = true;
    setError(null);

    // Immediate first poll
    pollOnceRef.current();

    // Add jitter so users don't all hit the server at the same time
    const jitter = Math.floor(Math.random() * 2000);
    jitterTimeoutRef.current = setTimeout(() => {
      // ← store it
      jitterTimeoutRef.current = null;
      intervalManager.current.start(() => {
        pollOnceRef.current();
      }, 8000);
    }, jitter);
  }, []);

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
          // token check removed
          startPolling();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [rideId, stopPolling, startPolling]);

  useEffect(() => {
    if (enabled && rideId && AppState.currentState === 'active') {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
    // token removed from deps — service reads it internally now
  }, [enabled, rideId, startPolling, stopPolling]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      const isNowActive = nextState === 'active';
      const isNowBackground = nextState.match(/inactive|background/);

      if (wasBackground && isNowActive) {
        console.log('📲 App foregrounded — resuming polling');
        if (enabledRef.current && !isPollingRef.current && tokenRef.current) {
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
      interval.clear();
      timeout.clear();
      console.log('🧹 Location polling cleanup completed');
    };
  }, []);

  return {isPolling, error, retryCount, nextRetryDelay, isOffline};
};
