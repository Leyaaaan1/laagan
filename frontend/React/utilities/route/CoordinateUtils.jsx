
export const processRideCoordinates = (rideData) => {
  if (!rideData) {
    console.warn('No ride data provided to processRideCoordinates');
    return { startingPoint: null, endingPoint: null, stopPoints: [] };
  }

  // Process Starting Point
  let startingPoint = null;
  if (rideData.startingPoint && typeof rideData.startingPoint === 'object') {
    startingPoint = {
      lat: rideData.startingPoint.lat || rideData.startingPoint.latitude,
      lng: rideData.startingPoint.lng || rideData.startingPoint.longitude,
      name: rideData.startingPoint.name || rideData.startingPoint.address || 'Starting Point',
    };
  } else if (rideData.startLat !== undefined && rideData.startLng !== undefined) {
    startingPoint = {
      lat: rideData.startLat,
      lng: rideData.startLng,
      name: rideData.startingPointName || 'Starting Point',
    };
  }

  // Process Ending Point
  let endingPoint = null;
  if (rideData.endingPoint && typeof rideData.endingPoint === 'object') {
    endingPoint = {
      lat: rideData.endingPoint.lat || rideData.endingPoint.latitude,
      lng: rideData.endingPoint.lng || rideData.endingPoint.longitude,
      name: rideData.endingPoint.name || rideData.endingPoint.address || rideData.endingPointName || 'Ending Point',
    };
  } else if (rideData.endLat !== undefined && rideData.endLng !== undefined) {
    endingPoint = {
      lat: rideData.endLat,
      lng: rideData.endLng,
      name: rideData.endingPointName || 'Ending Point',
    };
  }

  const stopPoints = (rideData.stopPoints || [])
    .map((stop, index) => {
      if (!stop) return null;

      // If already in correct format
      if (stop.lat !== undefined && stop.lng !== undefined) {
        return {
          lat: stop.lat,
          lng: stop.lng,
          name: stop.name || stop.address || `Stop ${index + 1}`,
        };
      }

      // Try alternative property names
      const lat = stop.lat || stop.latitude || stop.stopLatitude;
      const lng = stop.lng || stop.longitude || stop.stopLongitude;
      const name = stop.name || stop.address || stop.stopName || `Stop ${index + 1}`;

      if (lat !== undefined && lng !== undefined) {
        return { lat, lng, name };
      }

      console.warn(`Stop point ${index + 1} missing coordinates:`, stop);
      return null;
    })
    .filter(Boolean); // Remove null values

  console.log('Processed coordinates:', {
    startingPoint,
    endingPoint,
    stopPointsCount: stopPoints.length,
  });

  return { startingPoint, endingPoint, stopPoints };
};


export const isValidCoordinate = (coord) => {
  return (
    coord &&
    typeof coord === 'object' &&
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    !isNaN(coord.lat) &&
    !isNaN(coord.lng)
  );
};

