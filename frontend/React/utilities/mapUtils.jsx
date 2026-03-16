// React/utils/mapUtils.js
import { reverseGeocode, reverseGeocodeLandmark } from '../services/rideService';

// Add to your state: const [stopPoints, setStopPoints] = useState([]);
export const handleWebViewMessage = async (event, state) => {
    const data = JSON.parse(event.nativeEvent.data);

    if (data.type === 'mapClick') {
        const {
            mapMode, setLatitude, setLongitude,
            setStartingLatitude, setStartingLongitude,
            setEndingLatitude, setEndingLongitude,
            setLocationName, setStartingPoint, setEndingPoint, setSearchQuery,
            stopPoints, setStopPoints, // Add these
            token
        } = state;

        if (mapMode === 'location') {
            setLatitude(data.lat.toString());
            setLongitude(data.lng.toString());
            setLocationName('Fetching location name...');
        } else if (mapMode === 'starting') {
            setStartingLatitude(data.lat.toString());
            setStartingLongitude(data.lng.toString());
            setStartingPoint('Fetching location name...');
        } else if (mapMode === 'ending') {
            setEndingLatitude(data.lat.toString());
            setEndingLongitude(data.lng.toString());
            setEndingPoint('Fetching location name...');
        } else if (mapMode === 'stop') {
            // For stop points, add a placeholder while fetching
            setStopPoints([
                ...stopPoints,
                { lat: data.lat, lng: data.lng, name: 'Fetching location name...' }
            ]);
        }

        try {
            let locationName;
            if (mapMode === 'location') {
                locationName = await reverseGeocodeLandmark(token, data.lat, data.lng);
            }  else if (mapMode === 'starting' || mapMode === 'ending' || mapMode === 'stop') {
                locationName = await reverseGeocode(token, data.lat, data.lng);
            }
            if (locationName) {
                if (mapMode === 'location') {
                    setLocationName(locationName);
                    setSearchQuery(locationName);
                } else if (mapMode === 'starting') {
                    setStartingPoint(locationName);
                    setSearchQuery(locationName);
                } else if (mapMode === 'ending') {
                    setEndingPoint(locationName);
                    setSearchQuery(locationName);
                } else if (mapMode === 'stop') {
                    // Update the last stop point with the resolved name
                    setStopPoints(prev =>
                        prev.map((sp, idx) =>
                            idx === prev.length - 1
                                ? { ...sp, name: locationName }
                                : sp
                        )
                    );
                }
            } else {
                const fallbackName = `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`;
                if (mapMode === 'location') {
                    setLocationName(fallbackName);
                } else if (mapMode === 'starting') {
                    setStartingPoint(fallbackName);
                } else if (mapMode === 'ending') {
                    setEndingPoint(fallbackName);
                } else if (mapMode === 'stop') {
                    setStopPoints(prev =>
                        prev.map((sp, idx) =>
                            idx === prev.length - 1
                                ? { ...sp, name: fallbackName }
                                : sp
                        )
                    );
                }
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
        }
    }
};