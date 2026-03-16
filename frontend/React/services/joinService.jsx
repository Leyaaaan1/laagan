import { BASE_URL } from '@env';

const API_BASE_URL = BASE_URL || 'http://localhost:8080';


export const joinService = {

    joinRideByToken: async (inviteToken, token) => {
      try {
        const response = await fetch(`${API_BASE_URL}/join-request/${inviteToken}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorMessage;

          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData;
          } else {
            errorMessage = await response.text();
          }

          throw new Error(errorMessage || `Error: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error joining ride by token:', error);
        throw error;
      }
    },



    getJoinersByRide: async (generatedRidesId, token, status = null) => {
        try {
            let url = `${API_BASE_URL}/join-request/${generatedRidesId}/joiners`;

            if (status) {
                url += `?status=${status}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching joiners:', error);
            throw error;
        }
    },

  


    approveJoinRequest: async (joinId, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/join-request/approve/${joinId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error approving join request:', error);
            throw error;
        }
    },


    rejectJoinRequest: async (joinId, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/join-request/reject/${joinId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error rejecting join request:', error);
            throw error;
        }
    },





};
