import { BASE_URL } from '@env';

const API_BASE_URL = BASE_URL || 'http://localhost:8080';


export const joinService = {

  joinRideById: async (generatedRidesId, token) => {
    try {
      // Step 1: Get the invite URL for this ride
      const inviteResponse = await fetch(`${API_BASE_URL}/invite-request/${generatedRidesId}/invites`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!inviteResponse.ok) {
        throw new Error(`Failed to get invite: ${inviteResponse.status}`);
      }

      const inviteUrl = await inviteResponse.text();

      // Step 2: Extract the token from the URL
      let inviteToken = inviteUrl;
      if (inviteUrl.includes('/invite/link/')) {
        inviteToken = inviteUrl.split('/invite/link/').pop();
      }

      // Step 3: Join using the token
      const joinResponse = await fetch(`${API_BASE_URL}/join-request/${inviteToken}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!joinResponse.ok) {
        const contentType = joinResponse.headers.get('content-type');
        let errorMessage;
        if (contentType && contentType.includes('application/json')) {
          const errorData = await joinResponse.json();
          errorMessage = errorData.message || errorData;
        } else {
          errorMessage = await joinResponse.text();
        }
        throw new Error(errorMessage || `Error: ${joinResponse.status}`);
      }

      return await joinResponse.json();
    } catch (error) {
      console.error('Error joining ride by ID:', error);
      throw error;
    }
  },

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



    joinViaQrCode: async (scannedValue, token) => {
      // Handle both raw token and full URL from QR scan
      let inviteToken = scannedValue;

      if (scannedValue.includes('/invite/link/')) {
        inviteToken = scannedValue.split('/invite/link/').pop();
      }
      console.log('Token being sent:', token); // check it's not null/undefined
      console.log('Invite token:', inviteToken);

      const response = await fetch(`${API_BASE_URL}/join-request/qr/${inviteToken}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Failed to join ride: ${response.status}`);
      }
      return response.json();
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

        console.log('Status:', response.status); // ← what status is actually coming back?

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorMessage;
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || JSON.stringify(errorData);
          } else {
            errorMessage = await response.text();
          }
          console.log('Error body:', errorMessage); // ← what is the actual error?
          throw new Error(errorMessage || `Error: ${response.status}`);
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
