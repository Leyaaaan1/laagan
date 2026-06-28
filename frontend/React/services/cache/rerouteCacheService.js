// === rerouteCacheService.js ===
// Persists the reroute history per rideId so the snapshot can show every
// deviation during the ride, not just the latest one — and so the map can
// restore the most recent reroute instantly on reopen, before the first
// poll/SSE response comes back from the server.

import AsyncStorage from '@react-native-async-storage/async-storage';

const rerouteKey = rideId => `reroute_cache_${rideId}`;
const MAX_CACHED_REROUTES = 15; // cap so storage doesn't grow unbounded on a long ride

// Appends onto the ride's history instead of overwriting it.
export const saveRerouteCache = async (rideId, coordinates) => {
  try {
    const existing = await loadRerouteCache(rideId);
    const updated = [...existing, coordinates].slice(-MAX_CACHED_REROUTES);
    await AsyncStorage.setItem(rerouteKey(rideId), JSON.stringify(updated));
  } catch (_) {
    /* non-fatal — live poll will still work */
  }
};

// Always resolves to an array of raw reroute payloads, oldest → newest.
// Transparently upgrades the old single-value cache shape if it's still
// sitting in storage from before this change.
export const loadRerouteCache = async rideId => {
  try {
    const raw = await AsyncStorage.getItem(rerouteKey(rideId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;

    return [raw]; // legacy shape — wrap the single value
  } catch (_) {
    return [];
  }
};

export const clearRerouteCache = async rideId => {
  try {
    await AsyncStorage.removeItem(rerouteKey(rideId));
  } catch (_) {
    /* non-fatal */
  }
};
