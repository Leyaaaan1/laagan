/**
 * routePreviewCache.js
 *
 * Caches the GeoJSON route preview returned by GraphHopper/ORS so that:
 *   1. Repeat visits to RideStep3 with the same waypoints never hit the API again
 *   2. Rate-limit errors are avoided when the user tweaks stops but returns to
 *      the same start/end pair
 *   3. The preview still renders when the device is offline
 *
 * Cache key:
 *   route_preview_{sLat}:{sLng}:{eLat}:{eLng}:{stopsHash}
 *
 *   stopsHash is a compact digest of the stop-point array so that adding or
 *   removing a stop produces a different key without storing raw coordinates
 *   in the key string itself.
 *
 * TTL: 7 days — route geometry between two fixed points never changes, so a
 * long TTL is safe. The user can force a refresh by changing any waypoint.
 *
 * Pattern: identical to routeCache.js and ridesListCache.js already in the
 * project — same save / get / clear surface, same AsyncStorage usage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX      = 'route_preview_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Key helpers ──────────────────────────────────────────────────────────────

/**
 * Produces a short, stable hash string from the stop-points array so the
 * cache key stays under AsyncStorage's recommended key length.
 *
 * We only need collision-resistance at the "same user, same session" level —
 * a trivial sum of truncated coords is more than sufficient here.
 *
 * @param {Array<{lat: number, lng: number}>} stopPoints
 * @returns {string}
 */
const hashStops = (stopPoints = []) => {
  if (!stopPoints.length) return '0';
  const raw = stopPoints
    .map(s => `${(s.lat ?? s.stopLatitude ?? 0).toFixed(4)},${(s.lng ?? s.stopLongitude ?? 0).toFixed(4)}`)
    .join('|');
  // Simple djb2-style hash — fast, no dependencies
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash.toString(36); // base-36 keeps it short
};

/**
 * Builds the AsyncStorage key for a given set of waypoints.
 *
 * Coordinates are rounded to 5 decimal places (~1 m precision) so that
 * floating-point drift from parsing doesn't produce phantom cache misses.
 */
const makeKey = (sLat, sLng, eLat, eLng, stopPoints = []) => {
  const fmt = n => parseFloat(n).toFixed(5);
  return `${PREFIX}${fmt(sLat)}:${fmt(sLng)}:${fmt(eLat)}:${fmt(eLng)}:${hashStops(stopPoints)}`;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const routePreviewCache = {
  /**
   * save(sLat, sLng, eLat, eLng, stopPoints, geoJSON)
   *
   * Persists the GeoJSON returned by getRoutePreview().
   * Call this immediately after a successful API response in drawRoadRoute().
   */
  save: async (sLat, sLng, eLat, eLng, stopPoints, geoJSON) => {
    try {
      if (!geoJSON) return;
      const entry = { data: geoJSON, savedAt: Date.now() };
      await AsyncStorage.setItem(
        makeKey(sLat, sLng, eLat, eLng, stopPoints),
        JSON.stringify(entry),
      );
      console.log('[routePreviewCache] saved for route', `${sLat},${sLng} → ${eLat},${eLng}`);
    } catch (e) {
      // Non-fatal — the live API result is still used even if caching fails
      console.warn('[routePreviewCache] save failed:', e);
    }
  },

  /**
   * get(sLat, sLng, eLat, eLng, stopPoints)
   *
   * Returns the cached GeoJSON, or null if not cached / stale / corrupted.
   * Call this at the top of drawRoadRoute() before hitting the API.
   */
  get: async (sLat, sLng, eLat, eLng, stopPoints) => {
    try {
      const key = makeKey(sLat, sLng, eLat, eLng, stopPoints);
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;

      let entry;
      try {
        entry = JSON.parse(raw);
      } catch {
        // Corrupted entry — silently discard so the live API is used instead
        await AsyncStorage.removeItem(key);
        console.warn('[routePreviewCache] corrupted entry cleared');
        return null;
      }

      const age = Date.now() - (entry.savedAt ?? 0);
      if (age > CACHE_TTL_MS) {
        await AsyncStorage.removeItem(key);
        console.log('[routePreviewCache] stale entry cleared (age:', Math.round(age / 86400000), 'days)');
        return null;
      }

      console.log('[routePreviewCache] cache hit ✓');
      return entry.data;
    } catch (e) {
      console.warn('[routePreviewCache] get failed:', e);
      return null;
    }
  },

  /**
   * clear(sLat, sLng, eLat, eLng, stopPoints)
   *
   * Removes one specific route entry.
   * Useful if the user edits a route and you want to force a fresh fetch.
   */
  clear: async (sLat, sLng, eLat, eLng, stopPoints) => {
    try {
      await AsyncStorage.removeItem(makeKey(sLat, sLng, eLat, eLng, stopPoints));
    } catch (e) {
      console.warn('[routePreviewCache] clear failed:', e);
    }
  },

  /**
   * clearAll()
   *
   * Removes every route preview cache entry.
   * Call this if storage pressure becomes a concern, or from a dev/debug menu.
   */
  clearAll: async () => {
    try {
      const keys    = await AsyncStorage.getAllKeys();
      const preview = keys.filter(k => k.startsWith(PREFIX));
      if (preview.length > 0) {
        await AsyncStorage.multiRemove(preview);
      }
      console.log('[routePreviewCache] all entries cleared:', preview.length);
    } catch (e) {
      console.warn('[routePreviewCache] clearAll failed:', e);
    }
  },
};