import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {finishRide, forceFinishRide} from '../../../services/startService';
import {finishedRideService} from '../../../services/finishedRideService';

export const useFinishRideHandler = (
  activeRide,
  stopPolling,
  setPollingEnabled,
  onRideFinished,
  mapRef,
) => {
  const [isFinishing, setIsFinishing] = useState(false);

  const captureAndUploadSnapshot = useCallback(async () => {
    let snapshotUrl = null;

    try {
      // 1. First, fit the map to show the entire route
      console.log('[Snapshot] Fitting map to route...');
      await mapRef?.current?.fitMapToRoute();

      // 2. Wait a moment for the map to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Capture the snapshot
      console.log('[Snapshot] Capturing snapshot...');
      const snapshotUri = await mapRef?.current?.captureSnapshot();

      if (snapshotUri) {
        // 4. Upload to backend
        const file = {
          uri: snapshotUri,
          type: 'image/png',
          fileName: `snapshot-${
            activeRide?.generatedRidesId
          }-${Date.now()}.png`,
        };
        snapshotUrl = await finishedRideService.uploadSnapshot(
          activeRide.generatedRidesId,
          file,
        );
        console.log('[Snapshot] Uploaded successfully:', snapshotUrl);
      }
    } catch (error) {
      console.log('[Snapshot] Capture or upload failed:', error);
    }

    return snapshotUrl;
  }, [mapRef, activeRide?.generatedRidesId]);

  // ── Normal finish (creator reached ending point) ──────────────
  const handleFinishRide = useCallback(async () => {
    if (!activeRide?.generatedRidesId) return;
    try {
      setIsFinishing(true);
      setPollingEnabled(false);

      // Finish first — the backend only accepts a snapshot once a
      // finished record (group or personal) exists for this ride.
      const data = await finishRide(activeRide.generatedRidesId);
      stopPolling();

      // Capture/upload while the map is still mounted. It's persisted
      // server-side under generatedRidesId — fetch it later via getSnapshot().
      await captureAndUploadSnapshot();

      onRideFinished?.(data);
    } catch (err) {
      setPollingEnabled(true);
      Alert.alert('Could not finish ride', err.message || 'Please try again.');
    } finally {
      setIsFinishing(false);
    }
  }, [activeRide, stopPolling, setPollingEnabled, onRideFinished, captureAndUploadSnapshot]);

// ── Force finish ──────────────────────────────────────────────
  const handleForceFinishRide = useCallback(() => {
    if (!activeRide?.generatedRidesId) return;

    Alert.alert(
      'Force End Ride',
      'This will end the ride for all participants immediately, regardless of their progress. Are you sure?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Force End',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsFinishing(true);
              setPollingEnabled(false);

              const data = await forceFinishRide(activeRide.generatedRidesId);
              stopPolling();

              await captureAndUploadSnapshot();

              onRideFinished?.(data);
            } catch (err) {
              setPollingEnabled(true);
              Alert.alert('Could not force-end ride', err.message || 'Please try again.');
            } finally {
              setIsFinishing(false);
            }
          },
        },
      ],
      {cancelable: true},
    );
  }, [activeRide, stopPolling, setPollingEnabled, onRideFinished, captureAndUploadSnapshot]);

  return {
    isFinishing,
    handleFinishRide,
    handleForceFinishRide,
    captureAndUploadSnapshot,
  };
};
