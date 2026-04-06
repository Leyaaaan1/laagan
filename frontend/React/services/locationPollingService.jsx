
import {BASE_URL} from '@env';
import Geolocation from '@react-native-community/geolocation';
import {Platform, PermissionsAndroid} from 'react-native';

const API_BASE_URL = BASE_URL || 'http://localhost:8080';


export const getCurrentPosition = async () => {
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

    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
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
};

export const shareLocationAndFetchAll = async (
  rideId,
  latitude,
  longitude,
  token,
) => {
  if (!rideId || !token) {
    throw new Error('Missing rideId or token');
  }


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

  // Check for auth errors first
  if (response.status === 401 || response.status === 403) {
    console.error('⚠️ Token expired (HTTP', response.status + ')');
    throw new Error(
      response.status === 401
        ? 'Session expired. Please log in again.'
        : 'Unauthorized to share location.',
    );
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // The backend returns ALL riders' latest locations in one shot
  const allLocations = await response.json();

  console.log('✅ Locations received:', allLocations.length);
  allLocations.forEach(loc =>
    console.log(
      `  ${loc.initiator}: [${loc.latitude}, ${loc.longitude}] @ ${loc.locationName}`,
    ),
  );

  return allLocations;
};


export const calculateBackoffDelay = retryCount => {
  const MAX_DELAY = 30000;
  const delay = Math.min(Math.pow(2, retryCount - 1) * 1000, MAX_DELAY);
  return delay;
};


export const shouldRetry = retryCount => {
  const MAX_RETRIES = 3;
  return retryCount <= MAX_RETRIES;
};


export const isAuthError = err => {
  return (
    err.message.includes('Session expired') ||
    err.message.includes('Unauthorized') ||
    err.message.includes('401') ||
    err.message.includes('403')
  );
};


export const createIntervalManager = () => {
  let intervalId = null;

  return {
    start: (callback, intervalMs = 8000) => {
      if (intervalId) {
        console.warn('⚠️ Interval already running');
        return;
      }
      intervalId = setInterval(callback, intervalMs);
      console.log('⏱️ Polling interval started:', intervalMs, 'ms');
    },

    stop: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('⏹️ Polling interval stopped');
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
      if (locked) {
        console.log('⏭️ Poll skipped — previous poll still in flight');
        return false;
      }
      locked = true;
      return true;
    },

    release: () => {
      locked = false;
    },

    isLocked: () => locked,
  };
};
