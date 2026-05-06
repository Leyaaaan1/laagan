import {reverseGeocode, reverseGeocodeLandmark} from '../services/rideService';

export const handleWebViewMessage = (
  event,
  {
    mapMode,
    setLatitude,
    setLongitude,
    setStartingLatitude,
    setStartingLongitude,
    setEndingLatitude,
    setEndingLongitude,
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
    reverseGeocodeLandmark(lat, lng)
      .then(name => {
        if (name) setLocationName(name);
      })
      .catch(() => {});
  } else if (mapMode === 'starting') {
    setStartingLatitude(lat.toString());
    setStartingLongitude(lng.toString());
    reverseGeocode(lat, lng)
      .then(name => {
        if (name) setStartingPoint(name);
      })
      .catch(() => {});
  } else if (mapMode === 'ending') {
    setEndingLatitude(lat.toString());
    setEndingLongitude(lng.toString());
    reverseGeocode(lat, lng)
      .then(name => {
        if (name) setEndingPoint(name);
      })
      .catch(() => {});
  }
};
