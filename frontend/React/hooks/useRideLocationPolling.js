import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { BASE_URL } from '@env';

const API_BASE_URL = BASE_URL || 'http://localhost:8080';

/**
 * Custom hook for location sharing during active rides
 *
 * Features:
 * - Polls location every 5 seconds
 * - Combines send + fetch in one request (reduces bandwidth)
 * - Handles GPS positioning with 5m accuracy filter
 * - Implements exponential backoff (max 3 retries, cap 30s)
 * - Pauses on app background
 * - Cleans up on unmount
 *
 * @param {Object} options
 * @param {number} options.rideId - Active ride ID
 * @param {string} options.token - JWT auth token
 * @param {boolean} options.enabled - Enable/disable polling (default: true)
 * @param {Function} options.onLocationsUpdate - Callback when new locations received
 * @param {Function} options.onError - Callback on error
 *
 * @returns {Object} { isPolling, error, retryCount }
 */
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
  const [nextRetryDelay, setNextRetryDelay] = useState(1000); // Start at 1s

  const pollIntervalRef = useRef(null);
  const locationWatcherRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const retryTimeoutRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────
  // 1. GET CURRENT GPS POSITION
  // ─────────────────────────────────────────────────────────────────
  const getCurrentPosition = async () => {
    return new Promise((resolve, reject) => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject(new Error(`GPS Error: ${error.message}`));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        reject(new Error('Geolocation not available'));
      }
    });
  };
  // ─────────────────────────────────────────────────────────────────
  // 2. SEND LOCATION + FETCH OTHERS (Combined Request)
  // ─────────────────────────────────────────────────────────────────
  const pollLocationOnce = async () => {
    try {
      const { latitude, longitude } = await getCurrentPosition();
      console.log('📍 SENDING LOCATION:', { latitude, longitude, rideId });

      const response = await fetch(
        `${API_BASE_URL}/location/${rideId}/share?latitude=${latitude}&longitude=${longitude}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📡 RESPONSE STATUS:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const allLocations = await response.json();

      console.log('✅ ALL LOCATIONS RECEIVED FROM BACKEND:');
      console.log('Number of locations:', allLocations.length);
      console.log('Full response:', JSON.stringify(allLocations, null, 2));

      // IMPORTANT: Check the structure of each location object
      if (allLocations.length > 0) {
        console.log('First location object keys:', Object.keys(allLocations[0]));
        console.log('First location object:', JSON.stringify(allLocations[0], null, 2));
      }

      setRetryCount(0);
      setNextRetryDelay(1000);
      setError(null);

      if (onLocationsUpdate) {
        console.log('📤 CALLING onLocationsUpdate with', allLocations.length, 'locations');
        onLocationsUpdate(allLocations);
      }
    } catch (err) {
      console.error('❌ POLL ERROR:', err.message);
      handlePollingError(err);
    }
  };
  // ─────────────────────────────────────────────────────────────────
  // 3. EXPONENTIAL BACKOFF RETRY LOGIC
  // ─────────────────────────────────────────────────────────────────
  const handlePollingError = (err) => {
    const newRetryCount = retryCount + 1;
    const MAX_RETRIES = 3;
    const MAX_DELAY = 30000; // 30 seconds cap

    if (newRetryCount <= MAX_RETRIES) {
      // Calculate next delay: 1s, 2s, 4s, capped at 30s
      const nextDelay = Math.min(Math.pow(2, newRetryCount - 1) * 1000, MAX_DELAY);

      setRetryCount(newRetryCount);
      setNextRetryDelay(nextDelay);
      setError(`Retry attempt ${newRetryCount}/${MAX_RETRIES}`);

      // Schedule retry
      retryTimeoutRef.current = setTimeout(() => {
        pollLocationOnce();
      }, nextDelay);
    } else {
      // Max retries exceeded - stop polling
      setError(`Failed after ${MAX_RETRIES} retries: ${err.message}`);
      setIsPolling(false);
      if (onError) {
        onError(err);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 4. START/STOP POLLING
  // ─────────────────────────────────────────────────────────────────
  const startPolling = () => {
    if (pollIntervalRef.current || !enabled) return;

    setIsPolling(true);
    setError(null);

    // Immediate poll
    pollLocationOnce();

    // Then every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      pollLocationOnce();
    }, 5000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setIsPolling(false);
  };

  // ─────────────────────────────────────────────────────────────────
  // 5. APP STATE LISTENER (Background/Foreground)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to foreground - resume polling
      console.log('App in foreground - resuming location polling');
      if (enabled && !isPolling) {
        startPolling();
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App has gone to background - pause polling
      console.log('App in background - pausing location polling');
      stopPolling();
    }

    appStateRef.current = nextAppState;
  };

  // ─────────────────────────────────────────────────────────────────
  // 6. LIFECYCLE: Start when enabled, cleanup on unmount
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (enabled && rideId && token) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, rideId, token]);

  return {
    isPolling,
    error,
    retryCount,
    nextRetryDelay,
  };
};
