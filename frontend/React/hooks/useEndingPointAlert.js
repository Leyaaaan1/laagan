// hooks/useEndingPointAlert.js
import {useState, useEffect, useRef} from 'react';
import {getCheckpointArrivals} from '../services/startService';

export const useEndingPointAlert = (
  generatedRidesId,
  username,
  pollingEnabled,
) => {
  const [showEndingAlert, setShowEndingAlert] = useState(false);
  const hasDetected = useRef(false); // only show once

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
        const arrivals = await getCheckpointArrivals(generatedRidesId);

        const reachedEnding = arrivals.some(
          a => a.checkpointType === 'ENDING' && a.riderUsername === username,
        );

        if (reachedEnding) {
          hasDetected.current = true; // stop checking
          setShowEndingAlert(true);
          clearInterval(interval);
        }
      } catch (_) {
        // silently ignore polling errors
      }
    }, 4000); // poll every 4 seconds

    return () => clearInterval(interval);
  }, [generatedRidesId, username, pollingEnabled]);

  const dismissAlert = () => setShowEndingAlert(false);

  return {showEndingAlert, dismissAlert};
};
