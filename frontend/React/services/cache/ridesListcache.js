import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'rides_list_';
// 5 minutes — short TTL because the list changes when other users create rides
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Cache key for a given page + size combo, mirroring the backend key:
 * "page:0:size:10"
 */
const makeKey = (page, size, mode) =>
  `${PREFIX}${mode}:page:${page}:size:${size}`;

export const ridesListCache = {
  save: async (page, size, mode, data) => {
    try {
      const entry = {
        data,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(
        makeKey(page, size, mode),
        JSON.stringify(entry),
      );
    } catch (e) {
      console.warn('[ridesListCache] save failed:', e);
    }
  },

  get: async (page, size, mode) => {
    try {
      const raw = await AsyncStorage.getItem(makeKey(page, size, mode));
      if (!raw) return null;

      let entry;
      try {
        entry = JSON.parse(raw);
      } catch {
        // Corrupted — discard silently
        await ridesListCache.clearPage(page, size, mode);
        return null;
      }

      const age = Date.now() - (entry.savedAt ?? 0);
      if (age > CACHE_TTL_MS) {
        // Stale — let the caller fetch fresh data
        await ridesListCache.clearPage(page, size, mode);
        return null;
      }

      return entry.data;
    } catch (e) {
      console.warn('[ridesListCache] get failed:', e);
      return null;
    }
  },

  // Clear one specific page entry
  clearPage: async (page, size, mode) => {
    try {
      await AsyncStorage.removeItem(makeKey(page, size, mode));
    } catch (e) {
      console.warn('[ridesListCache] clearPage failed:', e);
    }
  },

  // Clear ALL rides list cache entries (call this after creating a ride)
  clearAll: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rideKeys = keys.filter(k => k.startsWith(PREFIX));
      if (rideKeys.length > 0) {
        await AsyncStorage.multiRemove(rideKeys);
      }
      console.log('[ridesListCache] All entries cleared');
    } catch (e) {
      console.warn('[ridesListCache] clearAll failed:', e);
    }
  },
};
