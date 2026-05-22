// === locationPollingService.jsx ===

import {API_BASE_URL, api} from './Apiclient';
import Geolocation from '@react-native-community/geolocation';
import {Platform, PermissionsAndroid} from 'react-native';

// ✅ NEW: Track last location time to throttle updates
let lastLocationUpdateTime = 0;
const LOCATION_THROTTLE_MS = 15000; // Minimum 15 seconds between location updates

export const getCurrentPosition = async () => {
  return new Promise(async (resolve, reject) => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (!granted) {
        reject(new Error('Location permission not granted'));
        return;
      }
    }

    // ✅ FIXED: Try coarse location first (fast, low battery drain)
    Geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => {
        // Coarse location failed — fallback to quick low-accuracy location
        Geolocation.getCurrentPosition(
          position =>
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          err => reject(new Error(`GPS Error (${err.code}): ${err.message}`)),
          {
            enableHighAccuracy: false, // ✅ CHANGED: Don't force GPS
            timeout: 10000,
            maximumAge: 60000, // ✅ CHANGED: Accept cached location up to 60s
          },
        );
      },
      {
        enableHighAccuracy: false, // ✅ FIXED: Use network/wifi location first
        timeout: 8000, // ✅ REDUCED: Faster timeout
        maximumAge: 30000, // ✅ INCREASED: Accept cached location
        // Removed forceRequestLocation and showLocationDialog
      },
    );
  });
};

// ✅ NEW: Throttle location updates to prevent overload
export const shouldThrottleLocationUpdate = () => {
  const now = Date.now();
  if (now - lastLocationUpdateTime < LOCATION_THROTTLE_MS) {
    return true; // Skip this update
  }
  lastLocationUpdateTime = now;
  return false;
};

// ✅ UPDATED: Better error mapping
export const shareLocationAndFetchAll = async (
  rideId,
  latitude,
  longitude,
  authToken,
) => {
  if (!rideId) throw new Error('Missing rideId');

  // ✅ NEW: Check if we should throttle this update
  if (shouldThrottleLocationUpdate() && latitude && longitude) {
    console.log('⏱️ Location update throttled — using last good location');
    // Return previous locations without updating
    return null; // Handle in calling code
  }

  console.log('🌍 Sharing location:', {rideId, latitude, longitude});

  try {
    const response = await api.post(
      `/location/${rideId}/share?latitude=${latitude}&longitude=${longitude}`,
      {},
      authToken,
    );

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch (e) {
        // Response is not JSON
      }
      throw new Error(errorMsg);
    }

    return response.json();
  } catch (error) {
    const errorMsg = error.message || String(error);

    // Authentication errors (fatal)
    if (
      errorMsg.includes('AUTH_EXPIRED') ||
      errorMsg.includes('Session expired') ||
      errorMsg.includes('401')
    ) {
      throw new Error('Session expired. Please log in again.');
    }

    if (
      errorMsg.includes('AUTH_FORBIDDEN') ||
      errorMsg.includes('Unauthorized') ||
      errorMsg.includes('403')
    ) {
      throw new Error('Unauthorized to share location.');
    }

    if (errorMsg.includes('AUTH_MISSING')) {
      throw new Error('AUTH_MISSING - No access token available');
    }

    // Server errors (retryable)
    if (
      errorMsg.includes('500') ||
      errorMsg.includes('502') ||
      errorMsg.includes('503') ||
      errorMsg.includes('504')
    ) {
      throw new Error(`SERVER_ERROR - ${errorMsg}`);
    }

    // Ride errors (fatal)
    if (
      errorMsg.includes('404') ||
      errorMsg.includes('not found') ||
      errorMsg.includes('Invalid state')
    ) {
      throw new Error(`FATAL_ERROR - ${errorMsg}`);
    }

    throw error;
  }
};

export const calculateBackoffDelay = retryCount =>
  Math.min(Math.pow(2, retryCount - 1) * 1000, 30000);

export const shouldRetry = retryCount => retryCount <= 3;

export const isAuthError = err => {
  const msg = err.message || String(err);
  return (
    msg.includes('Session expired') ||
    msg.includes('Unauthorized') ||
    msg.includes('AUTH_EXPIRED') ||
    msg.includes('AUTH_MISSING') ||
    msg.includes('401') ||
    msg.includes('403')
  );
};

export const isFatalError = err => {
  const msg = err.message || String(err);
  return (
    msg.includes('FATAL_ERROR') ||
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('Location permission not granted') ||
    msg.includes('Invalid state')
  );
};

export const shouldRetryError = retryCount => retryCount <= 3;

export const createIntervalManager = () => {
  let intervalId = null;
  return {
    start: (callback, intervalMs = 8000) => {
      if (intervalId) return;
      // ✅ CHANGED: Use 15-20 second interval instead of 8
      intervalId = setInterval(callback, Math.max(intervalMs, 15000));
    },
    stop: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
    isRunning: () => !!intervalId,
    clear: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  };
};

export const createTimeoutManager = () => {
  let timeoutId = null;
  return {
    set: (callback, delayMs) => {
      timeoutId = setTimeout(callback, delayMs);
      return timeoutId;
    },
    clear: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
    isPending: () => !!timeoutId,
  };
};

export const createPollLock = () => {
  let locked = false;
  return {
    acquire: () => {
      if (locked) return false;
      locked = true;
      return true;
    },
    release: () => {
      locked = false;
    },
    isLocked: () => locked,
  };
};
