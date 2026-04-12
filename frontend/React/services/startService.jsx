import {api} from './Apiclient';

export const startService = {
  startRide: async (generatedRidesId, token = null) => {
    const response = await api.post(`/start/${generatedRidesId}`, {}, token);
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

  deactivateRide: async (generatedRidesId, token = null) => {
    const response = await api.post(
      `/start/update/${generatedRidesId}`,
      {},
      token,
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

export const getActiveRide = async (token = null) => {
  const response = await api.get('/start/active', token);
  if (!response.ok) {
    const messages = {
      404: 'No active ride found',
      409: 'Ride is in conflicting state',
    };
    throw new Error(messages[response.status] || 'Failed to fetch active ride');
  }
  return response.json();
};

export const getStopPointsByRideId = async (generatedRidesId, token = null) => {
  const response = await api.get(
    `/riders/${generatedRidesId}/stop-points`,
    token,
  );
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
