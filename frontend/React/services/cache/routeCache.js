import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'route_coords_';

export const routeCache = {
  // Call this after getRideDetails() succeeds — save routeCoordinates locally
  save: async (generatedRidesId, routeCoordinates) => {
    try {
      if (!routeCoordinates) return;
      await AsyncStorage.setItem(
        `${PREFIX}${generatedRidesId}`,
        routeCoordinates,
      );
    } catch (e) {
      console.warn('[routeCache] save failed:', e);
    }
  },

  // Call this before getRideDetails() — returns null if not cached
  get: async generatedRidesId => {
    try {
      return await AsyncStorage.getItem(`${PREFIX}${generatedRidesId}`);
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
