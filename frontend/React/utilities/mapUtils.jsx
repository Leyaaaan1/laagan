import {reverseGeocode, reverseGeocodeLandmark} from '../services/rideService'; // adjust path as needed


export const handleWebViewMessage = (
  event,
  {
    mapMode,
    setLatitude,
    setLongitude,
    setStartingLatitude,
    setStartingLongitude,
    setStartingPointFromSearch,        // ✅ ADD THIS
    setEndingLatitude,
    setEndingLongitude,
    setEndingPointFromSearch,          // ✅ ADD THIS
    setLocationName,
    setStartingPoint,
    setEndingPoint,
  },
) => {
  let data;
  try {
    data = JSON.parse(event.nativeEvent.data);
  } catch {
    return;
  }

  if (data?.type !== 'mapClick' && data?.type !== 'markerDrag') return;

  const {lat, lng} = data;

  if (mapMode === 'location') {
    // Step 2 — landmark name is more meaningful for a ride destination
    setLatitude(lat.toString());
    setLongitude(lng.toString());

    if (setLocationName) {
      reverseGeocodeLandmark(lat, lng)
        .then(name => {
          if (name) setLocationName(name);
        })
        .catch(() => {});
    }
  } else if (mapMode === 'starting') {
    // Step 3 — plain address for start/end points
    setStartingLatitude(lat.toString());
    setStartingLongitude(lng.toString());
    setStartingPointFromSearch(false);  // ✅ ADD THIS - Mark as NOT from search (from map tap)

    if (setStartingPoint) {
      reverseGeocode(lat, lng)
        .then(name => {
          if (name) setStartingPoint(name);
        })
        .catch(() => {});
    }
  } else if (mapMode === 'ending') {
    setEndingLatitude(lat.toString());
    setEndingLongitude(lng.toString());
    setEndingPointFromSearch(false);    // ✅ ADD THIS - Mark as NOT from search (from map tap)

    if (setEndingPoint) {
      reverseGeocode(lat, lng)
        .then(name => {
          if (name) setEndingPoint(name);
        })
        .catch(() => {});
    }
  }
};