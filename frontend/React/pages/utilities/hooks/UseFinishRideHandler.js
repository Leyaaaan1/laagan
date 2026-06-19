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
      // ── Diagnostic: verify mapRef and its methods are reachable ──
      console.log('[Snapshot] mapRef:', mapRef);
      console.log('[Snapshot] mapRef.current:', mapRef?.current);
      console.log('[Snapshot] fitMapToRoute type:', typeof mapRef?.current?.fitMapToRoute);
      console.log('[Snapshot] captureSnapshot type:', typeof mapRef?.current?.captureSnapshot);
      console.log('[Snapshot] generatedRidesId:', activeRide?.generatedRidesId);

      if (!mapRef?.current) {
        console.warn('[Snapshot] mapRef.current is null — map is not mounted or ref was not forwarded. Skipping snapshot.');
        return null;
      }

      if (typeof mapRef.current.fitMapToRoute !== 'function') {
        console.warn('[Snapshot] fitMapToRoute is not a function — check useImperativeHandle on the map component.');
      }

      if (typeof mapRef.current.captureSnapshot !== 'function') {
        console.warn('[Snapshot] captureSnapshot is not a function — check useImperativeHandle on the map component.');
        return null;
      }

      // 1. Fit the map to show the entire route
      console.log('[Snapshot] Fitting map to route...');
      await mapRef.current.fitMapToRoute();

      // 2. Wait for the map to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Capture the snapshot
      console.log('[Snapshot] Capturing snapshot...');
      const snapshotUri = await mapRef.current.captureSnapshot();
      console.log('[Snapshot] snapshotUri:', snapshotUri);

      if (!snapshotUri) {
        console.warn('[Snapshot] captureSnapshot returned null/undefined — no image produced.');
        return null;
      }

      // 4. Upload to backend
      const file = {
        uri: snapshotUri,
        type: 'image/png',
        fileName: `snapshot-${activeRide?.generatedRidesId}-${Date.now()}.png`,
      };
      console.log('[Snapshot] Uploading file:', file);

      snapshotUrl = await finishedRideService.uploadSnapshot(
        activeRide.generatedRidesId,
        file,
      );
      console.log('[Snapshot] Uploaded successfully:', snapshotUrl);
    } catch (error) {
      console.warn('[Snapshot] Capture or upload failed:', error?.message ?? error);
    }

    return snapshotUrl;
  }, [mapRef, activeRide?.generatedRidesId]);

  // ── Normal finish ─────────────────────────────────────────────
  const handleFinishRide = useCallback(async () => {
    if (!activeRide?.generatedRidesId) return;
    try {
      setIsFinishing(true);
      setPollingEnabled(false);

      // Finish first — backend only accepts a snapshot once a
      // FinishedRide or PersonalFinishedRide record exists.
      const data = await finishRide(activeRide.generatedRidesId);
      stopPolling();

      // Capture/upload while the map is still mounted.
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