import {api} from './Apiclient';

export const startService = {
  startRide: async generatedRidesId => {
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

  deactivateRide: async generatedRidesId => {
    const response = await api.post(`/start/update/${generatedRidesId}`, {});
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

  leaveRide: async generatedRidesId => {
    const response = await api.post(`/start/leave/${generatedRidesId}`, {});
    if (!response.ok) {
      const messages = {
        403: 'Creator cannot leave ride. You must stop the ride instead.',
        404: 'Ride not found.',
        409: 'Ride is in a conflicting state.',
      };
      throw new Error(
        messages[response.status] ||
          'An error occurred while leaving the ride.',
      );
    }
    return true;
  },
};

export const finishRide = async generatedRidesId => {
  const response = await api.post(`/ride/finished/${generatedRidesId}`, {});
  if (!response.ok) {
    const messages = {
      400: 'Ride cannot be finished yet.',
      401: 'Unauthorized. Please log in again.',
      404: 'Ride not found.',
      409: 'Ride has already been finished.',
    };
    throw new Error(
      messages[response.status] ||
        'Failed to finish the ride. Please try again.',
    );
  }
  return response.json();
};

export const forceFinishRide = async generatedRidesId => {
  const response = await api.post(
    `/ride/finished/${generatedRidesId}/force`,
    {},
  );
  if (!response.ok) {
    const messages = {
      401: 'Unauthorized. Please log in again.',
      403: 'Only the ride creator can force-end a ride.',
      404: 'Ride not found.',
      409: 'Ride has already been finished.',
    };
    throw new Error(
      messages[response.status] ||
        'Failed to force-end the ride. Please try again.',
    );
  }
  return response.json();
};

export const getFinishedRideSummary = async generatedRidesId => {
  const response = await api.get(`/ride/${generatedRidesId}/summary`);
  if (!response.ok) {
    const messages = {
      404: 'Finished ride not found.',
      401: 'Unauthorized. Please log in again.',
      403: 'You do not have permission to view this ride summary.',
    };
    throw new Error(
      messages[response.status] ||
        'Failed to fetch ride summary. Please try again.',
    );
  }
  return response.json();
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
