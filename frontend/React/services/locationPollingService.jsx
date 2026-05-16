// === locationPollingService.jsx ===

import {API_BASE_URL, api} from './Apiclient';
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
            timeout: 10000, // ← INCREASED from 5000
            maximumAge: 60000,
          },
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // ← INCREASED from 8000
        maximumAge: 5000,
        forceRequestLocation: true,
        showLocationDialog: true,
      },
    );
  });
};

// ✅ NEW: Use centralized API client with automatic token refresh
export const shareLocationAndFetchAll = async (
  rideId,
  latitude,
  longitude,
  authToken, // ← Keep this for backward compatibility but may not need it
) => {
  if (!rideId) throw new Error('Missing rideId');

  console.log('🌍 Sharing location:', {rideId, latitude, longitude});

  try {
    // Use centralized api client which:
    // 1. Automatically handles 401 with token refresh
    // 2. Has retry logic built-in
    // 3. Accesses AuthContext for fresh tokens
    const response = await api.post(
      `/location/${rideId}/share?latitude=${latitude}&longitude=${longitude}`,
      {}, // Empty body
      authToken, // Pass token if provided, otherwise api client will fetch from context
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // Map API client errors to meaningful messages
    if (error.message === 'AUTH_EXPIRED') {
      throw new Error('Session expired. Please log in again.');
    }
    if (error.message === 'AUTH_FORBIDDEN') {
      throw new Error('Unauthorized to share location.');
    }
    if (error.message === 'AUTH_MISSING') {
      throw new Error('AUTH_MISSING - No access token available');
    }
    throw error;
  }
};

export const calculateBackoffDelay = retryCount =>
  Math.min(Math.pow(2, retryCount - 1) * 1000, 30000);

export const shouldRetry = retryCount => retryCount <= 3;

export const isAuthError = err =>
  err.message.includes('Session expired') ||
  err.message.includes('Unauthorized') ||
  err.message.includes('401') ||
  err.message.includes('403') ||
  err.message.includes('AUTH_EXPIRED') ||
  err.message.includes('AUTH_MISSING');

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
