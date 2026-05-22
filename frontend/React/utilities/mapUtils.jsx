
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
  } else if (mapMode === 'starting') {
    setStartingLatitude(lat.toString());
    setStartingLongitude(lng.toString());
  } else if (mapMode === 'ending') {
    setEndingLatitude(lat.toString());
    setEndingLongitude(lng.toString());
  }
};