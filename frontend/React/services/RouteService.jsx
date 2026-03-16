import { BASE_URL  } from '@env';

// Use API_BASE_URL instead of hardcoded value
const API_BASE_URL = BASE_URL  || 'http://localhost:8080';

export async function getRoutePreview(token, routeData) {
    try {
        const stopPoints = routeData.stopPoints?.map(stop => ({
            stopLatitude: parseFloat(stop.lat),
            stopLongitude: parseFloat(stop.lng)
        })) || [];

        const requestBody = {
            startLat: parseFloat(routeData.startLat),
            startLng: parseFloat(routeData.startLng),
            endLat: parseFloat(routeData.endLat),
            endLng: parseFloat(routeData.endLng),
            stopPoints: stopPoints
        };

        const response = await fetch(`${API_BASE_URL}/routes/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Route request failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching route preview:', error);
        throw error;
    }
}

export function createRouteData(startingLatitude, startingLongitude, endingLatitude, endingLongitude, stopPoints = []) {
    return {
        startLat: startingLatitude,
        startLng: startingLongitude,
        endLat: endingLatitude,
        endLng: endingLongitude,
        stopPoints: stopPoints.map(stop => ({
            lat: stop.lat,
            lng: stop.lng
        }))
    };
}

export async function getRouteCoordinates(token, generatedRidesId) {
    try {
        if (!generatedRidesId) {
            throw new Error('Generated rides ID is required');
        }

        const response = await fetch(`${API_BASE_URL}/routes/coordinate/${generatedRidesId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch route coordinates: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching route coordinates:', error);
        throw error;
    }
}