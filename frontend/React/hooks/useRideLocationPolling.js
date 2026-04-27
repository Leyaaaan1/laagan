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
  enabled = true,
  onLocationsUpdate,
  onError,
}) => {
  const {token} = useAuth(); // ✅ Get token from auth context
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
  const tokenRef = useRef(token); // ✅ Keep track of token updates

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    isOfflineRef.current = isOffline;
  }, [isOffline]);

  // ✅ NEW: Update tokenRef whenever token changes
  useEffect(() => {
    tokenRef.current = token;
    console.log(
      '🔐 Auth token updated:',
      token ? '✅ Available' : '❌ Missing',
    );
  }, [token]);

  const handlePollingError = useCallback(
    err => {
      retryCountRef.current += 1;
      const count = retryCountRef.current;

      if (isAuthError(err)) {
        setIsPolling(false);
        isPollingRef.current = false;
        setError(err.message);
        if (onError) {
          onError(err);
        }
        return;
      }

      if (shouldRetry(count)) {
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

      // ✅ FIX: Pass token as 4th parameter
      const allLocations = await shareLocationAndFetchAll(
        rideId,
        latitude,
        longitude,
        tokenRef.current, // ← PASS THE TOKEN HERE
      );

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
  }, [rideId, handlePollingError]); // ✅ Remove token from deps, use tokenRef

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

    // ✅ Check token before starting
    if (!tokenRef.current) {
      console.warn('⚠️  Cannot start polling: no access token available');
      setError('AUTH_MISSING - Please login again');
      return;
    }

    setIsPolling(true);
    isPollingRef.current = true;
    setError(null);

    // ✨ IMMEDIATE first poll - no waiting
    console.log('🚀 Starting location polling with immediate first update');
    pollOnceRef.current();

    // Then set interval for subsequent polls (every 8 seconds)
    // ℹ️ You can reduce 8000 to 5000 for faster updates if needed
    intervalManager.current.start(() => {
      pollOnceRef.current();
    }, 8000); // 8 seconds between polls (after first immediate one)
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

        if (enabledRef.current && rideId && tokenRef.current) {
          startPolling();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [rideId, stopPolling, startPolling]);

  useEffect(() => {
    if (enabled && rideId && tokenRef.current) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [enabled, rideId, token, startPolling, stopPolling]); // ✅ Add token to dependencies

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
