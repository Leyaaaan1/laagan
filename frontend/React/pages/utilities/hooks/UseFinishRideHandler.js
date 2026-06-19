import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {finishRide, forceFinishRide} from '../../../services/startService';
import {finishedRideService} from '../../../services/finishedRideService';
import {captureRideSnapshot} from '../../../utilities/captureRideSnapshot';

export const useFinishRideHandler = (
  activeRide,
  stopPolling,
  setPollingEnabled,
  onRideFinished,
  snapshotContainerRef, // ← renamed from mapRef — now points to the off-screen SVG View
) => {
  const [isFinishing, setIsFinishing] = useState(false);

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
      setIsFinishing(true);
      setPollingEnabled(false);

      // ✅ Capture while the polygon view is still mounted
      const snapshotUrl = await captureAndUploadSnapshot();

      const data = await finishRide(activeRide.generatedRidesId);
      stopPolling();

      onRideFinished?.(data, snapshotUrl); // ✅ pass snapshotUrl up
    } catch (err) {
      setPollingEnabled(true);
      Alert.alert('Could not finish ride', err.message || 'Please try again.');
    } finally {
      setIsFinishing(false);
    }
  }, [
    activeRide,
    stopPolling,
    setPollingEnabled,
    onRideFinished,
    captureAndUploadSnapshot,
  ]);

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

              // ✅ Capture before the ride is ended on the backend
              const snapshotUrl = await captureAndUploadSnapshot();

              const data = await forceFinishRide(activeRide.generatedRidesId);
              stopPolling();

              onRideFinished?.(data, snapshotUrl); // ✅ pass snapshotUrl up
            } catch (err) {
              setPollingEnabled(true);
              Alert.alert(
                'Could not force-end ride',
                err.message || 'Please try again.',
              );
            } finally {
              setIsFinishing(false);
            }
          },
        },
      ],
      {cancelable: true},
    );
  }, [
    activeRide,
    stopPolling,
    setPollingEnabled,
    onRideFinished,
    captureAndUploadSnapshot,
  ]);
  
  return {
    isFinishing,
    handleFinishRide,
    handleForceFinishRide,
    captureAndUploadSnapshot,
  };
};
