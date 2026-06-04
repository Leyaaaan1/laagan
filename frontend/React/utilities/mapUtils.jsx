import {reverseGeocode, reverseGeocodeLandmark} from '../services/rideService';

export const handleWebViewMessage = (
  event,
  {
    mapMode,
    setLatitude,
    setLongitude,
    setStartingLatitude,
    setStartingLongitude,
    setStartingPointFromSearch,
    startingPointFromSearch, // ✅ ADD — current boolean value
    setEndingLatitude,
    setEndingLongitude,
    setEndingPointFromSearch,
    endingPointFromSearch, // ✅ ADD — current boolean value
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
    setStartingLatitude(lat.toString());
    setStartingLongitude(lng.toString());
    setStartingPointFromSearch(false); // map tap resets the flag

    // ✅ Only reverse-geocode if this point was NOT set via search
    if (setStartingPoint && !startingPointFromSearch) {
      reverseGeocode(lat, lng)
        .then(name => {
          if (name) setStartingPoint(name);
        })
        .catch(() => {});
    }
  } else if (mapMode === 'ending') {
    setEndingLatitude(lat.toString());
    setEndingLongitude(lng.toString());
    setEndingPointFromSearch(false); // map tap resets the flag

    // ✅ Only reverse-geocode if this point was NOT set via search
    if (setEndingPoint && !endingPointFromSearch) {
      reverseGeocode(lat, lng)
        .then(name => {
          if (name) setEndingPoint(name);
        })
        .catch(() => {});
    }
  }
};
