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

export const forceFinishOwnRide = async generatedRidesId => {
  const response = await api.post(
    `/ride/finished/${generatedRidesId}/force/ownride`,
    {},
  );
  if (!response.ok) {
    const messages = {
      401: 'Unauthorized. Please log in again.',
      403: 'You are not a participant of this ride.',
      404: 'Ride not found.',
      409: 'Ride has already been finished.',
    };
    throw new Error(
      messages[response.status] ||
      'Failed to force-end your ride. Please try again.',
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

export const getPersonalSummary = async generatedRidesId => {
  const response = await api.get(
    `/ride/${generatedRidesId}/personal-summary`,
  );
  if (!response.ok) {
    const messages = {
      404: 'Personal summary not found.',
      401: 'Unauthorized. Please log in again.',
      403: 'You do not have permission to view this summary.',
    };
    throw new Error(
      messages[response.status] ||
        'You need to end the ride to view the summary.',
    );
  }
  return response.json();
};

export const getCheckpointArrivals = async generatedRidesId => {
  const response = await api.get(
    `/ride/${generatedRidesId}/checkpoint-arrivals`,
  );
  // Backend returns 404 or 5xx when no arrivals exist yet — treat both as empty
  if (response.status === 404 || response.status >= 500) return [];
  if (response.status === 401)
    throw new Error('Unauthorized. Please log in again.');
  if (!response.ok)
    throw new Error('Failed to fetch checkpoint arrivals. Please try again.');
  return response.json();
};

export const getActiveRide = async () => {
  const response = await api.get('/start/active');
  if (response.status === 404) return null; // no active ride — not an error
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

export const getRideStatus = async (generatedRidesId) => {
  const response = await api.get(`/status/${generatedRidesId}`);
  if (!response.ok) {
    const messages = {
      404: 'Ride not found.',
      401: 'Unauthorized. Please log in again.',
    };
    throw new Error(
      messages[response.status] || 'Failed to fetch ride status.',
    );
  }
  return response.json();
};

export const getRideStatusDetailed = async (generatedRidesId) => {
  const response = await api.get(`/status/${generatedRidesId}/detailed`);
  if (!response.ok) {
    const messages = {
      404: 'Ride not found.',
      401: 'Unauthorized. Please log in again.',
    };
    throw new Error(
      messages[response.status] || 'Failed to fetch detailed ride status.',
    );
  }
  return response.json();
};