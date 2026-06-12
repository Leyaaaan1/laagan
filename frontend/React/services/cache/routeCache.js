import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'route_coords_';
// 24-hour TTL — was declared before but never enforced in .get(); now it is.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const routeCache = {
  // Call this after getRideDetails() succeeds — saves routeCoordinates locally.
  // Now wraps the payload in { data, savedAt } so TTL can be enforced on read.
  save: async (generatedRidesId, routeCoordinates) => {
    try {
      if (!routeCoordinates) return;
      const entry = {data: routeCoordinates, savedAt: Date.now()};
      await AsyncStorage.setItem(
        `${PREFIX}${generatedRidesId}`,
        JSON.stringify(entry),
      );
    } catch (e) {
    }
  },

  // Call this before getRideDetails() — returns null if not cached / stale.
  // Handles both the new { data, savedAt } shape AND the old bare-object shape
  // written by earlier versions of the app, so existing cached data is reused
  // rather than discarded on first upgrade.
  get: async generatedRidesId => {
    try {
      const raw = await AsyncStorage.getItem(`${PREFIX}${generatedRidesId}`);
      if (raw === null) return null;

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Corrupted — discard silently
        await routeCache.clear(generatedRidesId);
        return null;
      }

      // ── New shape: { data, savedAt } ─────────────────────────────────────
      if (parsed && typeof parsed === 'object' && 'savedAt' in parsed) {
        const age = Date.now() - parsed.savedAt;
        if (age > CACHE_TTL_MS) {
          await routeCache.clear(generatedRidesId);
          return null;
        }
        return parsed.data;
      }

      // ── Legacy shape: bare coordinate object (no savedAt) ────────────────
      // Accept it as-is; it will be overwritten with a timestamp on the next
      // successful getRideDetails() call.
      return parsed;
    } catch (e) {
      return null;
    }
  },

  // Call this if a ride is deleted or recreated
  clear: async generatedRidesId => {
    try {
      await AsyncStorage.removeItem(`${PREFIX}${generatedRidesId}`);
    } catch (e) {
    }
  },
};
