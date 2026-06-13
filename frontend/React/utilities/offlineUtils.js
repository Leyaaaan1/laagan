import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

// ✅ NEW: Cache network status to avoid repeated native bridge calls
let networkStatusCache = null;
let networkStatusCacheTime = 0;
const NETWORK_STATUS_CACHE_TTL = 5000; // 5 seconds

/** * ✅ FIXED: Check if device has internet connectivity * Results are cached for 5 seconds to avoid expensive native bridge calls * Returns: { isConnected: boolean, type: 'wifi'|'cellular'|'none'|'unknown' } */
export const checkNetworkStatus = async () => {
  try {
    const now = Date.now();

    // ✅ Use cached result if still valid
    if (
      networkStatusCache &&
      now - networkStatusCacheTime < NETWORK_STATUS_CACHE_TTL
    ) {
      return networkStatusCache;
    }

    const state = await NetInfo.fetch();
    const result = {
      isConnected: state.isConnected ?? false,
      type: state.type,
    };

    // ✅ Cache the result
    networkStatusCache = result;
    networkStatusCacheTime = now;

    return result;
  } catch (err) {
    return {isConnected: false, type: 'unknown'};
  }
};

/** * ✅ NEW: Clear network status cache when network changes */
export const clearNetworkStatusCache = () => {
  networkStatusCache = null;
  networkStatusCacheTime = 0;
};

/** * Check if cached token is still valid (not expired) * Returns: { isValid: boolean, timeRemaining: number (ms) } */
export const isCachedTokenValid = async () => {
  try {
    const expiry = await AsyncStorage.getItem('tokenExpiry');
    if (!expiry) {
      return {isValid: false, timeRemaining: 0};
    }

    const expiryTime = parseInt(expiry, 10);
    const now = Date.now();
    const timeRemaining = expiryTime - now;

    // Token is valid if it has at least 5 minutes remaining
    const isValid = timeRemaining > 5 * 60 * 1000;

    return {isValid, timeRemaining};
  } catch (err) {
    return {isValid: false, timeRemaining: 0};
  }
};

/** * Attempt offline session restoration * If offline but token is fresh, load cached token * Returns: { success: boolean, token: string|null, reason: string } */
export const attemptOfflineRestore = async () => {
  try {
    // ✅ Use cached network check (5 second TTL)
    const networkStatus = await checkNetworkStatus();

    if (networkStatus.isConnected) {
      return {
        success: false,
        token: null,
        reason: 'Device is online — use normal restore',
      };
    }


    const tokenValidity = await isCachedTokenValid();

    if (!tokenValidity.isValid) {
      return {
        success: false,
        token: null,
        reason: `Token expired or expiring soon (${(
          tokenValidity.timeRemaining /
          1000 /
          60
        ).toFixed(1)} minutes remaining)`,
      };
    }

    const cachedToken = await AsyncStorage.getItem('cachedAccessToken');

    if (!cachedToken) {
      return {
        success: false,
        token: null,
        reason: 'No cached token found',
      };
    }



    return {
      success: true,
      token: cachedToken,
      reason: 'Restored from cache (offline)',
    };
  } catch (err) {
    return {success: false, token: null, reason: err.message};
  }
};

/** * Retrieve stored Keychain credentials without validation */
export const getStoredCredentials = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'com.ridershub.auth',
    });
    return credentials;
  } catch (err) {
    return null;
  }
};
