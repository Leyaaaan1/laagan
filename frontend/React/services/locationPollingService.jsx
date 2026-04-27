import {API_BASE_URL} from './Apiclient';
import Geolocation from '@react-native-community/geolocation';
import {Platform, PermissionsAndroid} from 'react-native';

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

    Geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => {
        // Fallback to quick low-accuracy location
        Geolocation.getCurrentPosition(
          position =>
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          err => reject(new Error(`GPS Error (${err.code}): ${err.message}`)),
          {
            enableHighAccuracy: false,
            timeout: 5000, // ← REDUCED from 10000
            maximumAge: 60000,
          },
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000, // ← REDUCED from 45000
        maximumAge: 5000, // ← REDUCED from 10000
        forceRequestLocation: true,
        showLocationDialog: true,
      },
    );
  });
};

// ✅ FIXED: Now accepts authToken as parameter instead of getting refresh token from Keychain
export const shareLocationAndFetchAll = async (
  rideId,
  latitude,
  longitude,
  authToken,
) => {
  if (!rideId) throw new Error('Missing rideId');
  if (!authToken) throw new Error('AUTH_MISSING - No access token available');

  console.log('🌍 Sharing location:', {rideId, latitude, longitude});

  const response = await fetch(
    `${API_BASE_URL}/location/${rideId}/share?latitude=${latitude}&longitude=${longitude}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      response.status === 401
        ? 'Session expired. Please log in again.'
        : 'Unauthorized to share location.',
    );
  }
  if (!response.ok)
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);

  return response.json();
};

export const calculateBackoffDelay = retryCount =>
  Math.min(Math.pow(2, retryCount - 1) * 1000, 30000);

export const shouldRetry = retryCount => retryCount <= 3;

export const isAuthError = err =>
  err.message.includes('Session expired') ||
  err.message.includes('Unauthorized') ||
  err.message.includes('401') ||
  err.message.includes('403');

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
