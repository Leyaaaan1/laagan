/**
 * activeRideStorage.js
 *
 * Persists the active ride object to AsyncStorage so it survives
 * app restarts when the device is offline.
 *
 * Place this file at:  src/utilities/activeRideStorage.js
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_RIDE_KEY = 'app:active_ride';

/**
 * Save the active ride to local storage.
 * Pass null/undefined to erase the stored entry.
 */
export const saveActiveRide = async ride => {
  try {
    if (ride) {
      await AsyncStorage.setItem(ACTIVE_RIDE_KEY, JSON.stringify(ride));
      console.log('💾 [Storage] Active ride saved:', ride.generatedRidesId);
    } else {
      await AsyncStorage.removeItem(ACTIVE_RIDE_KEY);
      console.log('🗑️ [Storage] Active ride cleared');
    }
  } catch (err) {
    // Storage failures are non-fatal — log and continue
    console.warn('⚠️ [Storage] Failed to save active ride:', err.message);
  }
};

/**
 * Load the previously saved active ride from local storage.
 * Returns null if nothing was stored or if parsing fails.
 */
export const loadCachedActiveRide = async () => {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_RIDE_KEY);
    if (!raw) return null;
    const ride = JSON.parse(raw);
    console.log(
      '📂 [Storage] Cached active ride loaded:',
      ride?.generatedRidesId,
    );
    return ride;
  } catch (err) {
    console.warn(
      '⚠️ [Storage] Failed to load cached active ride:',
      err.message,
    );
    return null;
  }
};

/**
 * Remove the stored active ride (e.g. after the rider leaves/finishes).
 */
export const clearCachedActiveRide = async () => {
  try {
    await AsyncStorage.removeItem(ACTIVE_RIDE_KEY);
    console.log('🗑️ [Storage] Active ride cache cleared');
  } catch (err) {
    console.warn(
      '⚠️ [Storage] Failed to clear active ride cache:',
      err.message,
    );
  }
};
