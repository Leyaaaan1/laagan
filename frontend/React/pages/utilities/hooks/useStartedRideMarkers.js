import {useState, useRef, useCallback} from 'react';
import {useRideLocationPolling} from '../../../hooks/useRideLocationPolling';

const MARKERS_UPDATE_THROTTLE_MS = 2000;
const LOCATION_THRESHOLD = 0.00005; // ~5 meters

export const useStartedRideMarkers = (
  rideId,
  pollingEnabled,
  onRiderFinished,
  mapRef,
  onReroute,
) => {
  // ← add onRiderFinished
  const [riderMarkers, setRiderMarkers] = useState({});
  const [pollingError, setPollingError] = useState(null);

  const prevMarkersRef = useRef({});
  const lastMarkersUpdateRef = useRef(0);
  const riderFinishedRef = useRef(false); // ← prevent firing multiple times

  const handleLocationsUpdate = useCallback(
    locations => {
      if (!locations || !Array.isArray(locations)) {
        return;
      }

      // ← check riderStatus before throttle so it's never missed
      if (!riderFinishedRef.current) {
        const finished = locations.some(
          loc => loc.riderStatus === 'RIDER_FINISHED',
        );
        if (finished) {
          riderFinishedRef.current = true;
          onRiderFinished?.();
        }
      }

      const now = Date.now();
      if (now - lastMarkersUpdateRef.current < MARKERS_UPDATE_THROTTLE_MS) {
        return;
      }

      lastMarkersUpdateRef.current = now;

      const markers = {};
      locations.forEach(loc => {
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
        setRiderMarkers(markers);
        prevMarkersRef.current = markers;
      }

      setPollingError(null);
    },
    [onRiderFinished],
  );

  const handlePollingError = useCallback(err => {
    setPollingError(err.message);
  }, []);

  const {isPolling, isOffline, retryCount} = useRideLocationPolling({
    rideId,
    enabled: pollingEnabled && !!rideId,
    onLocationsUpdate: handleLocationsUpdate,
    onReroute,
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