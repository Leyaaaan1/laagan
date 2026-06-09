import {useState, useEffect, useRef} from 'react';
import {getRideStatus} from '../services/startService';

export const useEndingPointAlert = (
  generatedRidesId,
  username,
  pollingEnabled,
) => {
  const [showEndingAlert, setShowEndingAlert] = useState(false);
  const hasDetected = useRef(false);
  const intervalRef = useRef(null); // ← store interval id in a ref

  useEffect(() => {
    if (
      !generatedRidesId ||
      !username ||
      !pollingEnabled ||
      hasDetected.current
    )
      return;

    intervalRef.current = setInterval(async () => {
      try {
        const statusData = await getRideStatus(generatedRidesId);

        const riderFinished = statusData?.riderStatuses?.some(
          r => r.riderUsername === username && r.status === 'RIDER_FINISHED',
        );
        const rideFinished = statusData?.currentStatus === 'FINISHED';

        if (riderFinished || rideFinished) {
          hasDetected.current = true;
          setShowEndingAlert(true);
          // Clear via ref — safe regardless of when this fires
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch (_) {
        // silently ignore polling errors
      }
    }, 4000);

    // Cleanup always clears the ref — no race condition
    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [generatedRidesId, username, pollingEnabled]);

  const dismissAlert = () => setShowEndingAlert(false);

  return {showEndingAlert, dismissAlert};
};
