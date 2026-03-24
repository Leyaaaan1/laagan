import { BASE_URL } from '@env';

const API_BASE_URL = BASE_URL || 'http://localhost:8080';

export const locationSharingService = {


  shareLocationAndGetParticipants: async (rideId, latitude, longitude, token) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/location/${rideId}/share?latitude=${latitude}&longitude=${longitude}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sharing location:', error);
      throw error;
    }
  },

  /**
   * Get locations without sharing current position
   * (for debugging or specific use cases)
   */
  getParticipantLocations: async (rideId, token) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/location/${rideId}/locations`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  },
};
