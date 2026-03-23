// frontend/React/utilities/NavigationParamsBuilder.js

export const buildRideStep4Params = (rideData, token, currentUsername) => {
  if (!rideData) {
    console.warn('buildRideStep4Params: rideData is empty');
    return {};
  }

  // ✅ DETERMINE IF CURRENT USER IS OWNER
  const isOwner = rideData.username === currentUsername;

  return {
    // IDs
    generatedRidesId: rideData.generatedRidesId || rideData.id,
    id: rideData.generatedRidesId || rideData.id,

    // Basic Info
    rideName: rideData.rideName || rideData.ridesName,
    locationName: rideData.locationName,
    description: rideData.description,
    riderType: rideData.riderType,
    date: rideData.date,
    distance: rideData.distance,

    // Route Details
    startingPoint: rideData.startingPoint,
    endingPoint: rideData.endingPoint,
    startingPointName: rideData.startingPointName,
    endingPointName: rideData.endingPointName,
    stopPoints: rideData.stopPoints || [],

    // Participants
    participants: rideData.participants || [],

    // ✅ AUTH & ROLE INFORMATION
    token: token,
    username: rideData.username,              // ride owner
    currentUsername: currentUsername,         // logged-in user
    startedBy: rideData.startedBy || rideData.username,
    isOwner: isOwner,                         // ✅ NEW: Boolean flag
    role: isOwner ? 'OWNER' : 'VISITOR',     // ✅ NEW: Role string

    // Images (optional)
    mapImage: rideData.mapImage || null,
    mapImageUrl: rideData.mapImageUrl || null,
    startMapImage: rideData.startMapImage || null,
    endMapImage: rideData.endMapImage || null,
    rideNameImage: rideData.rideNameImage || [],

    // Coordinates
    startLat: parseFloat(rideData.startLat) || parseFloat(rideData.startingLatitude) || 0,
    startLng: parseFloat(rideData.startLng) || parseFloat(rideData.startingLongitude) || 0,
    endLat: parseFloat(rideData.endLat) || parseFloat(rideData.endingLatitude) || 0,
    endLng: parseFloat(rideData.endLng) || parseFloat(rideData.endingLongitude) || 0,
  };
};

export const buildRideStep4ResetParams = (rideData, token, currentUsername, username) => {
  const params = buildRideStep4Params(rideData, token, currentUsername);

  return {
    index: 1,
    routes: [
      {
        name: 'RiderPage',
        params: { username: username, token: token }
      },
      {
        name: 'RideStep4',
        params: params
      },
    ],
  };
};