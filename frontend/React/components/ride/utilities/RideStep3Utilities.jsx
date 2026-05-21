/**
 * RideStep3Utilities.js
 *
 * Pure logic helpers for the RideStep3 screen.
 * No React, no styles — import freely from components or hooks.
 */

import {reverseGeocodeLandmark} from '../../../services/rideService';
import {createRouteData, getRoutePreview} from '../../../services/RouteService';
import {buildCenterMapScript, buildDrawRouteScript} from './RideStepUtils';
import {routePreviewCache} from '../../../services/cache/routePreviewCache';

// ─── Map init ────────────────────────────────────────────────────────────────

/**
 * Returns parsed lat/lng for the initial map centre.
 * Falls back to the geographic centre of the Philippines.
 */
export const getInitialMapCoords = (startingLatitude, startingLongitude) => ({
  lat: parseFloat(startingLatitude) || 12.8797,
  lng: parseFloat(startingLongitude) || 121.774,
});

// ─── Route drawing ───────────────────────────────────────────────────────────

/**
 * Returns true when both endpoints are set and differ enough to be distinct.
 */
export const canDrawRoute = (sLat, sLng, eLat, eLng) => {
  if (!sLat || !sLng || !eLat || !eLng) {
    return false;
  }
  const isSame =
    Math.abs(sLat - eLat) < 0.0001 && Math.abs(sLng - eLng) < 0.0001;
  return !isSame;
};

/**
 * Fetches route GeoJSON and injects the draw script into the WebView.
 *
 * @param {object} params
 * @param {number} params.sLat
 * @param {number} params.sLng
 * @param {number} params.eLat
 * @param {number} params.eLng
 * @param {Array}  params.stopPoints
 * @param {string} params.token
 * @param {object} params.webViewRef   – React ref to the WebView
 * @param {Function} params.setRouteLoading
 * @returns {Promise<void>}
 */
export const drawRoadRoute = async ({
  sLat,
  sLng,
  eLat,
  eLng,
  stopPoints,
  token,
  webViewRef,
  setRouteLoading,
}) => {
  if (!canDrawRoute(sLat, sLng, eLat, eLng)) {
    return;
  }

  setRouteLoading(true);
  try {
    // ── 1. Check cache first ────────────────────────────────────────────────
    // Same route + stops within 7 days → inject immediately, skip GraphHopper.
    const cached = await routePreviewCache.get(
      sLat,
      sLng,
      eLat,
      eLng,
      stopPoints,
    );

    if (cached?.features?.length) {
      console.log('[drawRoadRoute] cache hit — skipping GraphHopper call');
      webViewRef.current?.injectJavaScript(
        buildDrawRouteScript({
          routeGeoJSON: cached,
          startLat: sLat,
          startLng: sLng,
          endLat: eLat,
          endLng: eLng,
          stopPoints,
        }),
      );
      return; // done — setRouteLoading(false) runs in finally
    }

    // ── 2. Cache miss — call GraphHopper ────────────────────────────────────
    const routeData = createRouteData(sLat, sLng, eLat, eLng, stopPoints);
    const routeGeoJSON = await getRoutePreview(routeData, token);

    if (!routeGeoJSON?.features?.length) {
      return;
    }

    // ── 3. Persist so the next call is instant ──────────────────────────────
    // Fire-and-forget — a save failure must never block the map render.
    routePreviewCache
      .save(sLat, sLng, eLat, eLng, stopPoints, routeGeoJSON)
      .catch(e => console.warn('[drawRoadRoute] cache save (non-fatal):', e));

    // ── 4. Inject into WebView ──────────────────────────────────────────────
    webViewRef.current?.injectJavaScript(
      buildDrawRouteScript({
        routeGeoJSON,
        startLat: sLat,
        startLng: sLng,
        endLat: eLat,
        endLng: eLng,
        stopPoints,
      }),
    );
  } catch (e) {
    console.error('Route draw error:', e);
  } finally {
    setRouteLoading(false);
  }
};

// ─── Stop point handlers ─────────────────────────────────────────────────────

/**
 * Handles a map-tap event while the user is placing a stop.
 * Updates currentStop state with a reverse-geocoded name.
 *
 * @param {object} event           – WebView onMessage event
 * @param {Function} setCurrentStop
 * @param {Function} setAddingStopLoading
 * @returns {Promise<void>}
 */
export const handleStopMapTap = async (
  event,
  setCurrentStop,
  setAddingStopLoading,
) => {
  const data = JSON.parse(event.nativeEvent.data);
  if (data.type !== 'mapClick') {
    return;
  }

  setCurrentStop({lat: data.lat, lng: data.lng, name: 'Fetching…'});
  setAddingStopLoading(true);

  const name = await reverseGeocodeLandmark(data.lat, data.lng);
  setCurrentStop({
    lat: data.lat,
    lng: data.lng,
    name: name || `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`,
  });
  setAddingStopLoading(false);
};

/**
 * Confirms the pending stop and appends it to the stop list.
 *
 * @param {object|null} currentStop
 * @param {Function} setStopPoints
 * @param {Function} setIsAddingStop
 * @param {Function} setCurrentStop
 * @param {Function} setMapMode
 * @param {Function} onRouteReady   – callback to trigger route redraw
 */
export const confirmStopPoint = ({
  currentStop,
  setStopPoints,
  setIsAddingStop,
  setCurrentStop,
  setMapMode,
  onRouteReady,
}) => {
  if (!currentStop) {
    return;
  }

  setStopPoints(prev => [
    ...prev,
    {lat: currentStop.lat, lng: currentStop.lng, name: currentStop.name},
  ]);
  setIsAddingStop(false);
  setCurrentStop(null);
  setMapMode('stop');
  setTimeout(onRouteReady, 500);
};

/**
 * Removes a stop by index and triggers a route redraw.
 *
 * @param {number}   index
 * @param {Function} setStopPoints
 * @param {Function} onRouteReady
 */
export const removeStopPoint = (index, setStopPoints, onRouteReady) => {
  setStopPoints(prev => prev.filter((_, i) => i !== index));
  setTimeout(onRouteReady, 300);
};

// ─── Point finalization ──────────────────────────────────────────────────────

/**
 * Advances the map mode after the user confirms a start or end point.
 *
 * @param {string}   mapMode
 * @param {string}   startingPoint
 * @param {string}   endingPoint
 * @param {Function} setMapMode
 * @param {Function} setLocalQuery
 * @param {Function} onRouteReady
 */
export const finalizePointSelection = ({
  mapMode,
  startingPoint,
  endingPoint,
  setMapMode,
  setLocalQuery,
  onRouteReady,
}) => {
  if (mapMode === 'starting' && startingPoint) {
    setMapMode('ending');
    setLocalQuery('');
  }
  if (mapMode === 'ending' && endingPoint) {
    setMapMode('stop');
    setLocalQuery('');
    setTimeout(onRouteReady, 300);
  }
};

// ─── Location selection ──────────────────────────────────────────────────────

/**
 * Processes a search-result item selection: resolves the display name,
 * updates the relevant point state, centres the map, and optionally draws
 * the route if both endpoints are already set.
 *
 * @param {object} params
 * @param {object} params.item              – search result object
 * @param {string} params.mapMode
 * @param {Function} params.handleLocationSelect – parent handler (returns resolved name)
 * @param {Function} params.setStartingPoint
 * @param {Function} params.setEndingPoint
 * @param {Function} params.setLocalQuery
 * @param {object}   params.webViewRef
 * @param {string}   params.startingLatitude
 * @param {string}   params.startingLongitude
 * @param {string}   params.endingLatitude
 * @param {string}   params.endingLongitude
 * @param {Function} params.onRouteReady
 */
export const handleSelectLocationAndUpdateMap = async ({
  item,
  mapMode,
  handleLocationSelect,
  setStartingPoint,
  setEndingPoint,
  setLocalQuery,
  webViewRef,
  startingLatitude,
  startingLongitude,
  endingLatitude,
  endingLongitude,
  onRouteReady,
}) => {
  const lat = parseFloat(item.lat);
  const lon = parseFloat(item.lon);
  let resolvedName = item.display_name
    ? item.display_name.split(',')[0].trim()
    : `${lat}, ${lon}`;

  try {
    const parentName = await handleLocationSelect(item);
    if (parentName) {
      resolvedName = parentName;
    }
  } catch (e) {
    console.warn('handleLocationSelect error:', e);
  }

  if (mapMode === 'starting') {
    setStartingPoint(resolvedName);
  }
  if (mapMode === 'ending') {
    setEndingPoint(resolvedName);
  }
  setLocalQuery(resolvedName);

  webViewRef.current?.injectJavaScript(buildCenterMapScript(lat, lon));

  if (
    endingLatitude &&
    endingLongitude &&
    startingLatitude &&
    startingLongitude
  ) {
    setTimeout(onRouteReady, 500);
  }
};

// ─── WebView message router ──────────────────────────────────────────────────

/**
 * Routes incoming WebView messages to the appropriate handler.
 *
 * @param {object} params
 * @param {object} params.event
 * @param {string} params.mapMode
 * @param {boolean} params.isAddingStop
 * @param {string}  params.startingLatitude
 * @param {string}  params.startingLongitude
 * @param {string}  params.endingLatitude
 * @param {string}  params.endingLongitude
 * @param {Function} params.onRouteReady
 * @param {Function} params.handleMessage      – parent handler for normal map taps
 * @param {Function} params.setCurrentStop
 * @param {Function} params.setAddingStopLoading
 */
export const routeWebViewMessage = ({
  event,
  mapMode,
  isAddingStop,
  startingLatitude,
  startingLongitude,
  endingLatitude,
  endingLongitude,
  onRouteReady,
  handleMessage,
  setCurrentStop,
  setAddingStopLoading,
}) => {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    switch (data.type) {
      case 'mapReady':
        if (
          startingLatitude &&
          startingLongitude &&
          endingLatitude &&
          endingLongitude
        ) {
          setTimeout(onRouteReady, 1000);
        }
        break;
      case 'mapError':
        console.error('Map error:', data.error);
        break;
      default:
        if (mapMode === 'stop' && isAddingStop) {
          handleStopMapTap(event, setCurrentStop, setAddingStopLoading);
        } else {
          handleMessage(event);
        }
    }
  } catch (e) {
    console.error(e);
  }
};

// ─── Bottom sheet animation ──────────────────────────────────────────────────

/**
 * Returns the animated height interpolation for the bottom sheet.
 *
 * @param {Animated.Value} animValue
 * @returns {Animated.AnimatedInterpolation}
 */
export const getBottomSheetHeight = animValue =>
  animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['35%', '10%'],
  });

// ─── Derived UI values ────────────────────────────────────────────────────────

/**
 * Returns the search input placeholder based on the current map mode.
 *
 * @param {string} mapMode
 * @returns {string}
 */
export const getSearchPlaceholder = mapMode =>
  ({
    starting: 'Search starting point',
    ending: 'Search destination',
    stop: 'Search stop point',
  }[mapMode] || 'Search location');

/**
 * Returns the label for the finalize button based on the current map mode.
 *
 * @param {string} mapMode
 * @returns {string}
 */
export const getFinalizeButtonLabel = mapMode =>
  mapMode === 'starting' ? 'Set End' : 'Continue';

/**
 * Returns the mode label shown in the floating nav bar.
 *
 * @param {string} mapMode
 * @returns {string}
 */
export const getMapModeLabel = mapMode =>
  ({
    starting: 'START POINT',
    ending: 'END POINT',
    stop: 'STOPS',
  }[mapMode] || '');

/**
 * Returns true when the Create Ride button should be enabled.
 *
 * @param {string}  startingPoint
 * @param {string}  endingPoint
 * @param {boolean} loading
 * @returns {boolean}
 */
export const canCreateRide = (startingPoint, endingPoint, loading) =>
  !!startingPoint && !!endingPoint && !loading;
