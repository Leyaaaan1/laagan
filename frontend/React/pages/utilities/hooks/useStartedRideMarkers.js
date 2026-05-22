import {useState, useRef, useCallback} from 'react';
import {useRideLocationPolling} from '../../../hooks/useRideLocationPolling';

const MARKERS_UPDATE_THROTTLE_MS = 2000;
const LOCATION_THRESHOLD = 0.00005; // ~5 meters

export const useStartedRideMarkers = (rideId, pollingEnabled) => {
  const [riderMarkers, setRiderMarkers] = useState({});
  const [pollingError, setPollingError] = useState(null);

  const prevMarkersRef = useRef({});
  const lastMarkersUpdateRef = useRef(0);

  const handleLocationsUpdate = useCallback(locations => {
    // ✅ NEW: Handle null/undefined locations
    if (!locations || !Array.isArray(locations)) {
      console.warn('⚠️ Invalid locations received:', locations);
      return;
    }

    const now = Date.now();

    if (now - lastMarkersUpdateRef.current < MARKERS_UPDATE_THROTTLE_MS) {
      console.log('⏱️ Markers update throttled');
      return;
    }

    lastMarkersUpdateRef.current = now;

    const markers = {};
    locations.forEach(loc => {
      // ✅ Safely access location properties
      if (loc && loc.username) {
        markers[loc.username] = {
          latitude: loc.latitude || 0,
          longitude: loc.longitude || 0,
          updatedAt: loc.timestamp,
          locationName: loc.locationName || 'Unknown',
          distanceMeters: loc.distanceMeters || 0,
        };
      }
    });

    let hasChanged = false;

    const prevKeys = Object.keys(prevMarkersRef.current);
    const currKeys = Object.keys(markers);

    if (prevKeys.length !== currKeys.length) {
      hasChanged = true;
    } else {
      for (const username of currKeys) {
        const prev = prevMarkersRef.current[username];
        const curr = markers[username];

        if (!prev) {
          hasChanged = true;
          break;
        }

        const latDiff = Math.abs(prev.latitude - curr.latitude);
        const lngDiff = Math.abs(prev.longitude - curr.longitude);

        if (latDiff > LOCATION_THRESHOLD || lngDiff > LOCATION_THRESHOLD) {
          hasChanged = true;
          break;
        }
      }
    }

    if (hasChanged) {
      console.log('🔄 Rider markers updated:', Object.keys(markers).length);
      setRiderMarkers(markers);
      prevMarkersRef.current = markers;
    }

    setPollingError(null);
  }, []);

  const handlePollingError = useCallback(err => {
    setPollingError(err.message);
    console.error('Location polling failed:', err);
  }, []);

  const {isPolling, isOffline, retryCount} = useRideLocationPolling({
    rideId,
    enabled: pollingEnabled && !!rideId,
    onLocationsUpdate: handleLocationsUpdate,
    onError: handlePollingError,
  });

  return {
    riderMarkers,
    setRiderMarkers,
    pollingError,
    setPollingError,
    isPolling,
    isOffline,
    retryCount,
  };
};