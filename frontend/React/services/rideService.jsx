import {api} from './Apiclient';
import {routeCache} from './cache/routeCache';

export const searchLocation = async (query) => {
    const response = await api.get(
      `/location/search?query=${encodeURIComponent(query)}`,
    );
  if (!response.ok)
    throw new Error(`Failed to fetch location: ${response.status}`);
  return response.json();
};

export const searchCityOrLandmark = async (query, token = null) => {
  const response = await api.get(
    `/location/search-landmark?query=${encodeURIComponent(query)}`,

  );
  if (!response.ok)
    throw new Error(`Failed to fetch landmarks: ${response.status}`);
  return response.json();
};

export const reverseGeocode = async (lat, lon = null) => {
  try {
    const response = await api.get(`/location/reverse?lat=${lat}&lon=${lon}`);
    if (!response.ok)
      throw new Error(`Failed to reverse geocode: ${response.status}`);
    return response.text();
  } catch (err) {
    console.error('Reverse geocode fetch failed:', err);
    return null;
  }
};

export const reverseGeocodeLandmark = async (lat, lon = null) => {
  try {
    const response = await api.get(`/location/landmark?lat=${lat}&lon=${lon}`);
    if (!response.ok)
      throw new Error(`Failed to reverse geocode landmark: ${response.status}`);
    return response.text();
  } catch (err) {
    console.error('Reverse geocode landmark failed:', err);
    return null;
  }
};
export const getLocationImage = async (rideName, token = null) => {
  const response = await api.get(
    `/wikimedia/location?locationName=${encodeURIComponent(rideName)}`,
  );
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Failed to fetch location images: ${response.status}`);
  }
  return response.json();
};

export const createRide = async (rideData) => {
  const response = await api.post('/riders/create', rideData);
  const responseText = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${responseText}`);
  if (!responseText || responseText.trim() === '') return {success: true};
  try {
    return JSON.parse(responseText);
  } catch {
    return {success: true, rawResponse: responseText};
  }
};

export const fetchRideMapImage = async (generatedRidesId ) => {
  const response = await api.get(
    `/riders/${generatedRidesId}/map-image`
  );
  if (!response.ok) throw new Error('Failed to fetch map image');
  return response.text();
};

export const getRideDetails = async (generatedRidesId, ) => {
  const response = await api.get(`/riders/${generatedRidesId}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('No ride found');
    throw new Error(`Failed to fetch ride details: ${response.status}`);
  }
  const details = await response.json();
  const cached = await routeCache.get(generatedRidesId);
  if (cached) {
    return {...details, routeCoordinates: cached};
  } else {
    await routeCache.save(generatedRidesId, details.routeCoordinates);
    return details;
  }
};

export const fetchRides = async ( page = 0, size = 10) => {
  const response = await api.get(
    `/riders/rides?page=${page}&size=${size}`
  );
  if (!response.ok)
    throw new Error(`Failed to fetch rides: ${response.status}`);
  return response.json();
};

export const fetchMyRides = async ( page = 0, size = 10) => {
  const response = await api.get(
    `/riders/my-rides?page=${page}&size=${size}`
  );
  if (!response.ok)
    throw new Error(`Failed to fetch my rides: ${response.status}`);
  return response.json();
};
