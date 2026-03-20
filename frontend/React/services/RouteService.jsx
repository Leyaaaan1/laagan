import { BASE_URL  } from '@env';

// Use API_BASE_URL instead of hardcoded value
const API_BASE_URL = BASE_URL  || 'http://localhost:8080';

export async function getRoutePreview(token, routeData) {
  try {
    const startLat = parseFloat(routeData.startLat);
    const startLng = parseFloat(routeData.startLng);
    const endLat   = parseFloat(routeData.endLat);
    const endLng   = parseFloat(routeData.endLng);

    // Guard: reject if any coordinate is missing or zero
    if (!startLat || !startLng || !endLat || !endLng) {
      throw new Error('Invalid coordinates: one or more values are 0 or missing');
    }

    // Guard: reject if start and end are identical — ORS returns 400
    const isSamePoint =
      Math.abs(startLat - endLat) < 0.0001 &&
      Math.abs(startLng - endLng) < 0.0001;
    if (isSamePoint) {
      throw new Error('Start and end points are the same — set a different destination');
    }

    const stopPoints = routeData.stopPoints?.map(stop => ({
      stopLatitude: parseFloat(stop.lat),
      stopLongitude: parseFloat(stop.lng)
    })) || [];

    const requestBody = {
      startLat,
      startLng,
      endLat,
      endLng,
      stopPoints,
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