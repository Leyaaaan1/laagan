import {api} from './Apiclient';
import {routeCache} from './cache/routeCache';

export const startService = {
  startRide: async (generatedRidesId) => {
    const response = await api.post(`/start/${generatedRidesId}`, {});
    if (!response.ok) {
      const messages = {
        403: 'You are not authorized to start this ride.',
        404: 'Ride not found.',
        409: 'This ride has already been started.',
        410: 'You have a ride currently ongoing.',
      };
      throw new Error(
        messages[response.status] ||
          'An error occurred while starting the ride.',
      );
    }
    return response.json();
  },

  deactivateRide: async (generatedRidesId) => {
    const response = await api.post(
      `/start/update/${generatedRidesId}`,
      {},
    );
    if (!response.ok) {
      const messages = {
        404: 'Ride not found.',
        409: 'Ride is in a conflicting state.',
      };
      throw new Error(
        messages[response.status] ||
          'An error occurred while stopping the ride.',
      );
    }
    return true;
  },

};

export const getCheckpointArrivals = async generatedRidesId => {
  const response = await api.get(
    `/ride/${generatedRidesId}/checkpoint-arrivals`,
  );
  if (!response.ok) {
    const messages = {
      404: 'Ride not found.',
      401: 'Unauthorized. Please log in again.',
    };
    throw new Error(
      messages[response.status] ||
        'Failed to fetch checkpoint arrivals. Please try again.',
    );
  }
  return response.json();
};

export const getActiveRide = async () => {
  const response = await api.get('/start/active');
  if (!response.ok) {
    const messages = {
      404: 'No active ride found',
      409: 'Ride is in conflicting state',
    };
    throw new Error(messages[response.status] || 'Failed to fetch active ride');
  }
  return response.json();
};

export const getStopPointsByRideId = async generatedRidesId => {
  const response = await api.get(`/riders/${generatedRidesId}/stop-points`);
  if (!response.ok) {
    const messages = {
      404: 'Ride not found.',
      401: 'Unauthorized. Please log in again.',
      403: "You do not have permission to view this ride's stop points.",
    };
    throw new Error(
      messages[response.status] ||
        'Failed to fetch stop points. Please try again.',
    );
  }
  return response.json();
};




// After fetching active ride details:
const handleFetchActiveRide = async () => {
  try {
    const activeRide = await getActiveRide();

    // ✅ NEW: Cache the route immediately when ride is active
    if (activeRide && activeRide.generatedRidesId) {
      const routeCoordinates = {
        // Extract from activeRide response
        startLat: activeRide.startLat,
        startLng: activeRide.startLng,
        endLat: activeRide.endLat,
        endLng: activeRide.endLng,
        startingPointName: activeRide.startingPointName,
        endingPointName: activeRide.endingPointName,
        stopPoints: activeRide.stopPoints || [],
        routeCoordinates: activeRide.routeCoordinates, // GeoJSON if available
      };

      await routeCache
        .save(activeRide.generatedRidesId, routeCoordinates)
        .catch(e => {
          console.warn('[handleFetchActiveRide] Cache save (non-fatal):', e);
        });

      console.log('✅ Active ride route cached:', activeRide.generatedRidesId);
    }

    setActiveRide(activeRide);
  } catch (err) {
    console.error('Failed to fetch active ride:', err);
  }
};

