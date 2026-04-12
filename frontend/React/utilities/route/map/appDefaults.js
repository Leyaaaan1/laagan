/**
 * Default application constants
 * Single source of truth for default values across the app
 */

// ── Default Coordinates ────────────────────────────────────────────────────
// Philippines center as fallback (used only when current location cannot be fetched)
export const DEFAULT_COORDS = {
  latitude: '12.8797',
  longitude: '121.7740',
  name: 'Philippines',
};

// Used when we have lat/lng but need a default name
export const DEFAULT_LOCATION_NAME = 'Selected Location';

// Geolocation options
export const GEOLOCATION_OPTIONS = {
  fast: {
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 60000,
  },
  accurate: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
  },
};
