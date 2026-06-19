import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {
  finishRide,
  forceFinishRide,
  forceFinishOwnRide,
} from '../../../services/startService';
import {finishedRideService} from '../../../services/finishedRideService';
import {captureRideSnapshot} from '../../../utilities/captureRideSnapshot';

export const useFinishRideHandler = (
  activeRide,
  stopPolling,
  setPollingEnabled,
  onRideFinished,
  snapshotContainerRef, // ← renamed from mapRef — now points to the off-screen SVG View
) => {
  const [finishingAction, setFinishingAction] = useState(null); // null | 'normal' | 'force'
  const isFinishing = finishingAction !== null; // keep this — still useful for disabling both buttons while one is in flight

  const captureAndUploadSnapshot = useCallback(async () => {
    let snapshotUrl = null;

    try {
      if (!snapshotContainerRef?.current) {
        console.warn(
          '[Snapshot] snapshotContainerRef.current is null — view not mounted. Skipping.',
        );
        return null;
      }

      const result = await captureRideSnapshot({
        containerRef: snapshotContainerRef,
        generatedRidesId: activeRide?.generatedRidesId,
      });

      if (result.skipped) {
        console.warn('[Snapshot] Capture skipped:', result.reason);
        return null;
      }

      const file = {
        uri: result.snapshotUri,
        type: 'image/png',
        fileName: `snapshot-${activeRide?.generatedRidesId}-${Date.now()}.png`,
      };

      snapshotUrl = await finishedRideService.uploadSnapshot(
        activeRide.generatedRidesId,
        file,
      );
    } catch (error) {
      console.warn(
        '[Snapshot] Capture or upload failed:',
        error?.message ?? error,
      );
    }

    return snapshotUrl;
  }, [snapshotContainerRef, activeRide?.generatedRidesId]);

  // ── handleFinishRide and handleForceFinishRide stay exactly the same ──
  // (no changes needed below this point — they just call captureAndUploadSnapshot)

  const handleFinishRide = useCallback(async () => {
    if (!activeRide?.generatedRidesId) return;
    try {
      setFinishingAction('normal');

      setPollingEnabled(false);

      //  Capture while the polygon view is still mounted
      const snapshotUrl = await captureAndUploadSnapshot();

      const data = await finishRide(activeRide.generatedRidesId);
      stopPolling();

      onRideFinished?.(data, snapshotUrl); //  pass snapshotUrl up
    } catch (err) {
      setPollingEnabled(true);
      Alert.alert('Could not finish ride', err.message || 'Please try again.');
    } finally {
      setFinishingAction(null);
    }
  }, [
    activeRide,
    stopPolling,
    setPollingEnabled,
    onRideFinished,
    captureAndUploadSnapshot,
  ]);

  const handleForceFinishRide = useCallback(
    async (endForAll = false) => {
      if (!activeRide?.generatedRidesId) return;

      try {
        setFinishingAction('force');
        setPollingEnabled(false);

        // Capture before the ride is ended on the backend
        const snapshotUrl = await captureAndUploadSnapshot();

        const data = endForAll
          ? await forceFinishRide(activeRide.generatedRidesId)
          : await forceFinishOwnRide(activeRide.generatedRidesId);

        stopPolling();

        onRideFinished?.(data, snapshotUrl);
      } catch (err) {
        setPollingEnabled(true);
        Alert.alert(
          'Could not force-end ride',
          err.message || 'Please try again.',
        );
      } finally {
        setFinishingAction(null);
      }
    },
    [
      activeRide,
      stopPolling,
      setPollingEnabled,
      onRideFinished,
      captureAndUploadSnapshot,
    ],
  );

  return {
    isFinishing,
    handleFinishRide,
    finishingAction,
    handleForceFinishRide,
    captureAndUploadSnapshot,
  };
};
