import {api} from './Apiclient';
import {routeCache} from './cache/routeCache'; // ✅ NEW
import {checkNetworkStatus} from '../utilities/offlineUtils';

export const getRoutePreview = async routeData => {
  const startLat = parseFloat(routeData.startLat);
  const startLng = parseFloat(routeData.startLng);
  const endLat = parseFloat(routeData.endLat);
  const endLng = parseFloat(routeData.endLng);

  if (!startLat || !startLng || !endLat || !endLng) {
    throw new Error('Invalid coordinates: one or more values are 0 or missing');
  }
  if (
    Math.abs(startLat - endLat) < 0.0001 &&
    Math.abs(startLng - endLat) < 0.0001
  ) {
    throw new Error(
      'Start and end points are the same — set a different destination',
    );
  }

  const body = {
    startLat,
    startLng,
    endLat,
    endLng,
    stopPoints: (routeData.stopPoints || []).map(s => ({
      stopLatitude: parseFloat(s.lat),
      stopLongitude: parseFloat(s.lng),
    })),
  };

  const response = await api.post('/routes/preview', body);
  if (!response.ok) {
    const messages = {
      401: 'Session expired.',
      403: 'Not authorized.',
      404: 'Route not found.',
      400: 'Invalid route coordinates.',
    };
    throw new Error(
      messages[response.status] || `Route request failed: ${response.status}`,
    );
  }
  return response.json();
};

// ✅ UPDATED: getRouteCoordinates with offline cache fallback
export const getRouteCoordinates = async generatedRidesId => {
  if (!generatedRidesId) throw new Error('Generated rides ID is required');

  try {
    // ✅ NEW: Try to fetch from server first
    const response = await api.get(`/routes/coordinate/${generatedRidesId}`);

    if (!response.ok) {
      const messages = {
        401: 'Session expired.',
        403: 'Not authorized.',
        404: 'Route not found.',
      };
      throw new Error(
        messages[response.status] ||
          `Failed to fetch route coordinates: ${response.status}`,
      );
    }

    const data = await response.json();

    // ✅ NEW: Cache the successful response for offline use
    await routeCache.save(generatedRidesId, data).catch(e => {
    });

    return data;
  } catch (err) {
    // ✅ NEW: If server fetch fails, try offline cache

    const cachedData = await routeCache.get(generatedRidesId);

    if (cachedData) {
      return cachedData; // Return cached data if available
    }

    // No cache available, re-throw the original error
    throw err;
  }
};

export const createRouteData = (
  startLat,
  startLng,
  endLat,
  endLng,
  stopPoints = [],
) => ({
  startLat,
  startLng,
  endLat,
  endLng,
  stopPoints: stopPoints.map(s => ({lat: s.lat, lng: s.lng})),
});
