/**
 * rideStepUtils.js
 *
 * Shared pure helpers used across RideStep1–RideStep4.
 * Keeping these here avoids duplicating logic (e.g. formatDate appears in
 * both Step1 and Step4) and makes unit-testing trivial.
 */

// ─── Date formatting ──────────────────────────────────────────────────────────

/**
 * Returns a human-readable date/time string.
 * Accepts a Date object or any string/number parseable by `new Date()`.
 *
 * @param  {Date|string|number} dateValue
 * @returns {string}
 */
export const formatDate = (dateValue) => {
  if (!dateValue) { return 'Not specified'; }
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (isNaN(d.getTime())) { return String(dateValue); }

  const datePart = d.toLocaleDateString('en-US', {
    month: 'long', day: '2-digit', year: 'numeric',
  });
  const hours   = d.getHours() % 12 || 12;
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm    = d.getHours() >= 12 ? 'PM' : 'AM';
  return `${datePart} ${hours}:${minutes}${ampm}`;
};

/**
 * Returns date + time as two separate strings for split display.
 *
 * @param  {Date} date
 * @returns {{ dateStr: string, timeStr: string }}
 */
export const splitDateTime = (date) => ({
  dateStr: date.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }),
  timeStr: date.toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', hour12: true,
  }),
});

// ─── Location helpers ─────────────────────────────────────────────────────────

/**
 * Returns a display-friendly string for a location value that may be a
 * plain string, an object with `name` / `address`, or null/undefined.
 *
 * @param  {string|object|null|undefined} location
 * @returns {string}
 */
export const getLocationDisplayName = (location) => {
  if (typeof location === 'string') { return location; }
  if (location && typeof location === 'object') {
    return location.name || location.address || 'Location';
  }
  return 'Not specified';
};

/**
 * Extracts the short name from a Nominatim `display_name` (everything
 * before the first comma).
 *
 * @param  {string} displayName  Full Nominatim display_name
 * @param  {number} [lat]        Fallback latitude
 * @param  {number} [lng]        Fallback longitude
 * @returns {string}
 */
export const shortLocationName = (displayName, lat, lng) => {
  if (displayName) { return displayName.split(',')[0].trim(); }
  if (lat != null && lng != null) { return `${lat}, ${lng}`; }
  return 'Unknown location';
};

// ─── Ride type helpers ────────────────────────────────────────────────────────

/**
 * Maps a riderType string to a FontAwesome icon name.
 *
 * @param  {string} type
 * @returns {string}  FontAwesome icon name
 */
export const getRideTypeIcon = (type) => {
  const icons = {
    car:          'car',
    motor:        'motorcycle',
    bike:         'bicycle',
    run:          'shoe-prints',
    'cafe Racers':'rocket',
  };
  return icons[type] || 'circle';
};

/**
 * The ordered list of selectable ride types used in Step 1.
 * Centralised here so both the selector and the summary card share the
 * same data without importing from each other.
 */
export const RIDE_TYPE_OPTIONS = [
  { type: 'car',         icon: 'car',        label: 'Car'         },
  { type: 'motor',       icon: 'motorcycle', label: 'Motorcycle'  },
  { type: 'run',         icon: 'user',       label: 'Run'         },
  { type: 'bike',        icon: 'bicycle',    label: 'Bike'        },
  { type: 'cafe Racers', icon: 'rocket',     label: 'Cafe Racers' },
];

// ─── Search / debounce helper ─────────────────────────────────────────────────

/**
 * Returns a debounced change handler and a clear handler for the location
 * search input used in Step 2 and Step 3.
 *
 * Usage (inside a component):
 *
 *   const debounceRef = useRef(null);
 *   const { handleLocalChange, handleClearSearch } = buildSearchHandlers({
 *     debounceRef,
 *     setLocalQuery,
 *     handleSearchInputChange,
 *     setSearchQuery,
 *     delay: 400,
 *   });
 *
 * @param {{ debounceRef, setLocalQuery, handleSearchInputChange, setSearchQuery, delay? }} opts
 * @returns {{ handleLocalChange: (value: string) => void, handleClearSearch: () => void }}
 */
export const buildSearchHandlers = ({
                                      debounceRef,
                                      setLocalQuery,
                                      handleSearchInputChange,
                                      setSearchQuery,
                                      delay = 400,
                                    }) => ({
  handleLocalChange: (value) => {
    setLocalQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearchInputChange(value), delay);
  },
  handleClearSearch: () => {
    setLocalQuery('');
    clearTimeout(debounceRef.current);
    if (setSearchQuery)          { setSearchQuery(''); }
    handleSearchInputChange('');
  },
});

// ─── Map injection helpers ────────────────────────────────────────────────────

/**
 * Generates the JavaScript snippet to centre the map and update the marker.
 *
 * @param  {number} lat
 * @param  {number} lng
 * @param  {number} [zoom=15]
 * @returns {string}  JS string for WebView.injectJavaScript
 */
export const buildCenterMapScript = (lat, lng, zoom = 15) =>
  `if(window.centerMap&&window.updateMarker){window.centerMap(${lat},${lng},${zoom});window.updateMarker(${lat},${lng});}true;`;

/**
 * Generates the JS snippet to draw a road route with markers.
 *
 * @param  {object} params
 * @param  {string} params.routeGeoJSON   Serialised GeoJSON
 * @param  {number} params.startLat
 * @param  {number} params.startLng
 * @param  {number} params.endLat
 * @param  {number} params.endLng
 * @param  {Array}  params.stopPoints     Array of { lat, lng }
 * @returns {string}
 */
export const buildDrawRouteScript = ({
                                       routeGeoJSON,
                                       startLat, startLng,
                                       endLat, endLng,
                                       stopPoints = [],
                                     }) => `
  (function(){
    try {
      const g = ${JSON.stringify(routeGeoJSON)};
      if (window.clearRoute)           { window.clearRoute(); }
      if (window.drawGeoJsonRoute)     { window.drawGeoJsonRoute(g, {color:'#1e40af',weight:4,opacity:0.8}); }
      if (window.addRouteMarkers)      { window.addRouteMarkers(
        [${startLat},${startLng}],
        [${endLat},${endLng}],
        ${JSON.stringify(stopPoints.map(s => [s.lat, s.lng]))}
      ); }
      if (window.fitGeoJsonRouteToMap) { window.fitGeoJsonRouteToMap(g); }
    } catch(e){ console.error(e); }
  })(); true;
`;