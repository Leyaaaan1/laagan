// snapshotCache.js
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = 'ride_snapshot_';

export const snapshotCache = {
  save: async (generatedRidesId, snapshotUrl) => {
    try {
      await AsyncStorage.setItem(`${PREFIX}${generatedRidesId}`, snapshotUrl);
    } catch {}
  },
  get: async generatedRidesId => {
    try {
      return await AsyncStorage.getItem(`${PREFIX}${generatedRidesId}`);
    } catch {
      return null;
    }
  },
  clear: async generatedRidesId => {
    try {
      await AsyncStorage.removeItem(`${PREFIX}${generatedRidesId}`);
    } catch {}
  },
};
