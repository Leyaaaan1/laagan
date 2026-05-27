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

};
