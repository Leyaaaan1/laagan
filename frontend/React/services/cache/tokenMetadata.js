import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPIRY_KEY = 'tokenExpiry';
const CACHED_TOKEN_KEY = 'cachedAccessToken'; // ✅ NEW
const DEFAULT_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

/** * Save token expiry time */
export const saveTokenExpiry = async (expiresInSeconds = 3600) => {
  try {
    const expiryTime = Date.now() + expiresInSeconds * 1000;
    await AsyncStorage.setItem(EXPIRY_KEY, expiryTime.toString());
  } catch (err) {
  }
};

/** * Get token expiry time */
export const getTokenExpiry = async () => {
  try {
    const expiry = await AsyncStorage.getItem(EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  } catch (err) {
    return null;
  }
};

/** * Save access token for offline use (NEW!) * This allows offline session continuation */
export const saveCachedAccessToken = async token => {
  try {
    await AsyncStorage.setItem(CACHED_TOKEN_KEY, token);
  } catch (err) {
  }
};

/** * Get cached access token (NEW!) */
export const getCachedAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(CACHED_TOKEN_KEY);
  } catch (err) {
    return null;
  }
};

/** * Clear cached access token (NEW!) */
export const clearCachedAccessToken = async () => {
  try {
    await AsyncStorage.removeItem(CACHED_TOKEN_KEY);
  } catch (err) {
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
    return null;
  }
};

/** * Clear token expiry metadata */
export const clearTokenExpiry = async () => {
  try {
    await AsyncStorage.removeItem(EXPIRY_KEY);
    await clearCachedAccessToken(); // ✅ Also clear cached token
  } catch (err) {
  }
};
