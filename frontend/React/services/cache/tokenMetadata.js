import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPIRY_KEY = 'tokenExpiry';
const DEFAULT_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

export const saveTokenExpiry = async (expiresInSeconds = 3600) => {
  try {
    const expiryTime = Date.now() + expiresInSeconds * 1000;
    await AsyncStorage.setItem(EXPIRY_KEY, expiryTime.toString());
    console.log(`⏱️ Token expiry saved: ${new Date(expiryTime).toISOString()}`);
  } catch (err) {
    console.error('Failed to save token expiry:', err);
  }
};

export const getTokenExpiry = async () => {
  try {
    const expiry = await AsyncStorage.getItem(EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  } catch (err) {
    console.error('Failed to get token expiry:', err);
    return null;
  }
};

export const clearTokenExpiry = async () => {
  try {
    await AsyncStorage.removeItem(EXPIRY_KEY);
  } catch (err) {
    console.error('Failed to clear token expiry:', err);
  }
};

export const isTokenExpiringSoon = async (warningThreshold = 5 * 60 * 1000) => {
  try {
    const expiry = await getTokenExpiry();
    if (!expiry) return false;

    const now = Date.now();
    const timeUntilExpiry = expiry - now;

    return timeUntilExpiry > 0 && timeUntilExpiry < warningThreshold;
  } catch (err) {
    console.error('Failed to check token expiry:', err);
    return false;
  }
};

export const getTimeUntilExpiry = async () => {
  try {
    const expiry = await getTokenExpiry();
    if (!expiry) return null;

    const timeUntilExpiry = expiry - Date.now();
    return timeUntilExpiry > 0 ? timeUntilExpiry : 0;
  } catch (err) {
    console.error('Failed to get time until expiry:', err);
    return null;
  }
};
