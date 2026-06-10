// === locationPollingService.jsx ===

import {api} from './Apiclient';
import Geolocation from '@react-native-community/geolocation';
import {AppState, Platform, PermissionsAndroid} from 'react-native'; // AppState added

// Movement-based skip logic lives in useRideLocationPolling (hook layer).
// The service layer is intentionally stateless — it just executes what it's told.

export const getCurrentPosition = async () => {
  return new Promise(async (resolve, reject) => {
    // Block GPS entirely if app is not in the foreground.
    // Avoids background location access which violates Play Store and
    // App Store background location policies when the app has not
    // declared background location usage.
    if (AppState.currentState !== 'active') {
      reject(new Error('APP_BACKGROUNDED'));
      return;
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (!granted) {
        reject(new Error('Location permission not granted'));
        return;
      }
    }

    Geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => {
        Geolocation.getCurrentPosition(
          position =>
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          err => reject(new Error(`GPS Error (${err.code}): ${err.message}`)),
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000,
          },
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 30000,
      },
    );
  });
};

export const shareLocationAndFetchAll = async (rideId, latitude, longitude) => {
  if (!rideId) throw new Error('Missing rideId');

  console.log('🌍 Sharing location:', {rideId, latitude, longitude});

  try {
    const response = await api.post(
      `/location/${rideId}/share?latitude=${latitude}&longitude=${longitude}`,
      {},
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
      const err = new Error('Please log in again.');
      err.code = 'AUTH_MISSING'; // code used for logic branching in isAuthError()
      throw err;
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

/**
 * GET-only fetch — used by the hook when the rider hasn't moved enough to
 * warrant uploading their own position, but we still want to refresh other
 * participants' locations on the map.
 *
 * Maps to: GET /location/{rideId}/all  →  RideLocationService.getAllRiderLocations()
 */
export const fetchAllLocations = async rideId => {
  if (!rideId) throw new Error('Missing rideId');

  try {
    const response = await api.get(`/location/${rideId}/all-riders`);

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch (e) {
        /* not JSON */
      }
      throw new Error(errorMsg);
    }

    return response.json();
  } catch (error) {
    const errorMsg = error.message || String(error);

    if (
      errorMsg.includes('401') ||
      errorMsg.includes('AUTH_EXPIRED') ||
      errorMsg.includes('Session expired')
    ) {
      throw new Error('Session expired. Please log in again.');
    }
    if (
      errorMsg.includes('403') ||
      errorMsg.includes('AUTH_FORBIDDEN') ||
      errorMsg.includes('Unauthorized')
    ) {
      throw new Error('Unauthorized to view locations.');
    }
    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      throw new Error(`FATAL_ERROR - ${errorMsg}`);
    }
    if (
      errorMsg.includes('500') ||
      errorMsg.includes('502') ||
      errorMsg.includes('503') ||
      errorMsg.includes('504')
    ) {
      throw new Error(`SERVER_ERROR - ${errorMsg}`);
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
      intervalId = setInterval(callback, intervalMs);
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
