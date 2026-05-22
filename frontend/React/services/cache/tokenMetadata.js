import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPIRY_KEY = 'tokenExpiry';
const CACHED_TOKEN_KEY = 'cachedAccessToken'; // ✅ NEW
const DEFAULT_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

/** * Save token expiry time */
export const saveTokenExpiry = async (expiresInSeconds = 3600) => {
  try {
    const expiryTime = Date.now() + expiresInSeconds * 1000;
    await AsyncStorage.setItem(EXPIRY_KEY, expiryTime.toString());
    console.log(`⏱️ Token expiry saved: ${new Date(expiryTime).toISOString()}`);
  } catch (err) {
    console.error('Failed to save token expiry:', err);
  }
};

/** * Get token expiry time */
export const getTokenExpiry = async () => {
  try {
    const expiry = await AsyncStorage.getItem(EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  } catch (err) {
    console.error('Failed to get token expiry:', err);
    return null;
  }
};

/** * Save access token for offline use (NEW!) * This allows offline session continuation */
export const saveCachedAccessToken = async token => {
  try {
    await AsyncStorage.setItem(CACHED_TOKEN_KEY, token);
    console.log('💾 Access token cached for offline use');
  } catch (err) {
    console.error('Failed to cache access token:', err);
  }
};

/** * Get cached access token (NEW!) */
export const getCachedAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(CACHED_TOKEN_KEY);
  } catch (err) {
    console.error('Failed to retrieve cached token:', err);
    return null;
  }
};

/** * Clear cached access token (NEW!) */
export const clearCachedAccessToken = async () => {
  try {
    await AsyncStorage.removeItem(CACHED_TOKEN_KEY);
    console.log('🗑️ Cached access token cleared');
  } catch (err) {
    console.error('Failed to clear cached token:', err);
  }
};

/** * Get time remaining until token expires */
export const getTimeUntilExpiry = async () => {
  try {
    const expiry = await getTokenExpiry();
    if (!expiry) return null;
    const timeRemaining = expiry - Date.now();
    return timeRemaining > 0 ? timeRemaining : 0;
  } catch (err) {
    console.error('Failed to get time until expiry:', err);
    return null;
  }
};

/** * Clear token expiry metadata */
export const clearTokenExpiry = async () => {
  try {
    await AsyncStorage.removeItem(EXPIRY_KEY);
    await clearCachedAccessToken(); // ✅ Also clear cached token
    console.log('🗑️ Token metadata cleared');
  } catch (err) {
    console.error('Failed to clear token expiry:', err);
  }
};
