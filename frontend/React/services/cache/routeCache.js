import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'route_coords_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const routeCache = {
  // Call this after getRideDetails() succeeds — save routeCoordinates locally
  save: async (generatedRidesId, routeCoordinates) => {
    try {
      if (!routeCoordinates) return;

      // ✅ NEW: Stringify the object before storing
      const serialized = JSON.stringify(routeCoordinates);

      await AsyncStorage.setItem(`${PREFIX}${generatedRidesId}`, serialized);
    } catch (e) {
      console.warn('[routeCache] save failed:', e);
    }
  },

  // Call this before getRideDetails() — returns null if not cached
  get: async generatedRidesId => {
    try {
      const cached = await AsyncStorage.getItem(`${PREFIX}${generatedRidesId}`);

      if (cached === null) {
        return null;
      }

      // ✅ NEW: Parse the JSON string back into an object
      try {
        return JSON.parse(cached);
      } catch (parseErr) {
        // ✅ NEW: If parsing fails, the cache is corrupted — clear it
        console.warn(
          '[routeCache] Corrupted data detected, clearing cache for',
          generatedRidesId,
        );
        await routeCache.clear(generatedRidesId);
        return null;
      }
    } catch (e) {
      console.warn('[routeCache] get failed:', e);
      return null;
    }
  },

  // Call this if a ride is deleted or recreated
  clear: async generatedRidesId => {
    try {
      await AsyncStorage.removeItem(`${PREFIX}${generatedRidesId}`);
    } catch (e) {
      console.warn('[routeCache] clear failed:', e);
    }
  },
};
