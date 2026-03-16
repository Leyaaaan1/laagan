

import { BASE_URL  } from '@env';

// Use API_BASE_URL instead of hardcoded value
const API_BASE_URL = BASE_URL  || 'http://localhost:8080';
export const startService = {
    startRide: async (generatedRidesId, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/start/${generatedRidesId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const status = response.status;
                let errorMessage = '';

                switch (status) {
                    case 403:
                        errorMessage = 'You are not authorized to start this ride.';
                        break;
                    case 404:
                        errorMessage = 'Ride not found.';
                        break;
                    case 409:
                        errorMessage = 'This ride has already been started.';
                        break;
                    case 410:
                        errorMessage = 'You have currently rides ongoing.';
                        break;
                    default:
                        errorMessage = 'An error occurred while starting the ride.';
                }

                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('Error starting ride:', error);
            throw error;
        }
    },

};
export async function getActiveRide(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/start/active`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const status = response.status;
            switch (status) {
                case 404:
                    throw new Error('No active ride found');
                case 409:
                    throw new Error('Ride is in conflicting state');
                default:
                    throw new Error('Failed to fetch active ride');
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching active ride:', error);
        throw error;
    }
}

export async function getStopPointsByRideId(generatedRidesId, token) {
    const response = await fetch(`${API_BASE_URL}/riders/${generatedRidesId}/stop-points`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch stop points');
    }
    return await response.json();
}