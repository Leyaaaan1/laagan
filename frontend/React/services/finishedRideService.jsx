// File: frontend/React/services/finishedRideService.js

import {api} from './Apiclient';

export const finishedRideService = {
  // Finish ride and get comprehensive data in one call
  finishRide: async generatedRidesId => {
    const response = await api.post('/ride/finish', {
      generatedRidesId,
    });
    if (!response.ok) {
      throw new Error('Failed to finish ride');
    }
    return response.json();
  },

  // Poll for completion status while ride is active (OPTIONAL - only if needed)
  getCompletionStatus: async generatedRidesId => {
    const response = await api.get(
      `/ride/${generatedRidesId}/completion-status`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch completion status');
    }
    return response.json();
  },
};
