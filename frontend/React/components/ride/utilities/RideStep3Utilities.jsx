
import {reverseGeocode} from '../../../services/rideService';
import {createRouteData, getRoutePreview} from '../../../services/RouteService';
import {buildCenterMapScript, buildDrawRouteScript} from './RideStepUtils';
import {routePreviewCache} from '../../../services/cache/routePreviewCache';


export const getInitialMapCoords = (startingLatitude, startingLongitude) => ({
  lat: parseFloat(startingLatitude) || 12.8797,
  lng: parseFloat(startingLongitude) || 121.774,
});

export const canDrawRoute = (sLat, sLng, eLat, eLng) => {
  if (!sLat || !sLng || !eLat || !eLng) {
    return false;
  }
  const isSame =
    Math.abs(sLat - eLat) < 0.0001 && Math.abs(sLng - eLng) < 0.0001;
  return !isSame;
};


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

  const name = await reverseGeocode(data.lat, data.lng);

  setCurrentStop({
    lat: data.lat,
    lng: data.lng,
    name: name || `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`,
  });

  setAddingStopLoading(false);
};

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


export const getBottomSheetHeight = animValue =>
  animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['35%', '10%'],
  });


export const getSearchPlaceholder = mapMode =>
  ({
    starting: 'Search starting point',
    ending: 'Search destination',
    stop: 'Search stop point',
  }[mapMode] || 'Search location');


export const getFinalizeButtonLabel = mapMode =>
  mapMode === 'starting' ? 'Set End' : 'Continue';

export const getMapModeLabel = mapMode =>
  ({
    starting: 'START POINT',
    ending: 'END POINT',
    stop: 'STOPS',
  }[mapMode] || '');


export const canCreateRide = (startingPoint, endingPoint, loading) =>
  !!startingPoint && !!endingPoint && !loading;
