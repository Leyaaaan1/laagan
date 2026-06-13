/** * Parse route GeoJSON safely */
export const parseRouteData = routeCoordinates => {
  if (!routeCoordinates) return null;

  // If it's already an object (parsed), return it
  if (typeof routeCoordinates === 'object') {
    return routeCoordinates;
  }

  // If it's a string, parse it
  try {
    return JSON.parse(routeCoordinates);
  } catch (e) {
    return null;
  }
};

/** * Build route data for map rendering in BOTH online and offline modes */
export const buildRouteDataForMap = activeRide => {
  if (!activeRide) return null;

  // ✅ FIXED: Ensure we have route coordinates in proper format
  let features = null;
  let coordinates = null;

  // Try to get GeoJSON features
  if (activeRide.routeCoordinates) {
    const parsed = parseRouteData(activeRide.routeCoordinates);
    if (parsed && parsed.features) {
      features = parsed.features;
    } else if (parsed && Array.isArray(parsed)) {
      coordinates = parsed;
    }
  }

  // Fallback to coordinates array
  if (!coordinates && activeRide.coordinates) {
    coordinates = activeRide.coordinates;
  }

  // Return complete route data for offline display
  return {
    features, // GeoJSON features if available
    coordinates, // Coordinate array if available
    // Include additional metadata for offline rendering
    routeCoordinates: activeRide.routeCoordinates,
  };
};

/** * Build map data from ride coordinates */
export const buildMapData = (activeRide, processRideCoordinates) => {
  if (!activeRide) {
    return {startingPoint: null, stopPoints: [], endingPoint: null};
  }
  return processRideCoordinates(activeRide);
};
