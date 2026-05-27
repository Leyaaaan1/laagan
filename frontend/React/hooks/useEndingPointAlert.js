// hooks/useEndingPointAlert.js
import {useState, useEffect, useRef} from 'react';
import {getRideStatus} from '../services/startService';

// FIX: was calling getCheckpointArrivals every 4s — that endpoint loads all
// checkpoint records + does auth checks, causing the constant log spam:
//   "getCheckpointArrivalsByRide called [generatedRidesId=...]"
//
// Now polls getRideStatus instead, which is lightweight and already polled
// elsewhere in the app. We detect completion via riderStatuses[].status
// === 'RIDER_FINISHED' for the current user, which is set by
// rideStatusService.markRiderFinished() in CheckPointUtility right after
// the ENDING arrival is saved.
export const useEndingPointAlert = (
  generatedRidesId,
  username,
  pollingEnabled,
) => {
  const [showEndingAlert, setShowEndingAlert] = useState(false);
  const hasDetected = useRef(false);

  useEffect(() => {
    if (
      !generatedRidesId ||
      !username ||
      !pollingEnabled ||
      hasDetected.current
    )
      return;

    const interval = setInterval(async () => {
      try {
        const statusData = await getRideStatus(generatedRidesId);

        // Check via riderStatuses (set by markRiderFinished in CheckPointUtility)
        const riderFinished = statusData?.riderStatuses?.some(
          r => r.riderUsername === username && r.status === 'RIDER_FINISHED',
        );

        // Also handle the case where the whole ride is already FINISHED
        const rideFinished = statusData?.currentStatus === 'FINISHED';

        if (riderFinished || rideFinished) {
          hasDetected.current = true;
          setShowEndingAlert(true);
          clearInterval(interval);
        }
      } catch (_) {
        // silently ignore polling errors
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [generatedRidesId, username, pollingEnabled]);

  const dismissAlert = () => setShowEndingAlert(false);

  return {showEndingAlert, dismissAlert};
};
