import {reverseGeocode, reverseGeocodeLandmark} from '../services/rideService'; // adjust path as needed

export const handleWebViewMessage = (
  event,
  {
    mapMode,
    setLatitude,
    setLongitude,
    setStartingLatitude,
    setStartingLongitude,
    setStartingPointFromSearch,
    setEndingLatitude,
    setEndingLongitude,
    setEndingPointFromSearch,
    setLocationName,
    setLocationSelected, // reset the from-search flag when user taps map in Step 2
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
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    // User tapped the map directly — this is NOT a search selection, so
    // clear locationSelected so isLocationFromSearch is sent as false to the backend.
    if (setLocationSelected) setLocationSelected(false);

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
    setStartingPointFromSearch(false); // NOT from search — use georeverse

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
    setEndingPointFromSearch(false); // NOT from search — use georeverse

    if (setEndingPoint) {
      reverseGeocode(lat, lng)
        .then(name => {
          if (name) setEndingPoint(name);
        })
        .catch(() => {});
    }
  }
};
