import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  finishRide,
  forceFinishRide,
  forceFinishOwnRide,
} from '../../../services/startService';
import { finishedRideService } from '../../../services/finishedRideService';
import { captureRideSnapshot } from '../../../utilities/captureRideSnapshot';

export const useFinishRideHandler = (
  activeRide,
  stopPolling,
  setPollingEnabled,
  onRideFinished,
  snapshotContainerRef,
  polygonSnapshotOptions = {},
) => {
  const [finishingAction, setFinishingAction] = useState(null); // null | 'normal' | 'force'
  const isFinishing = finishingAction !== null;
  const { prepareView: preparePolygonView } = polygonSnapshotOptions;

  const handleFinishRide = useCallback(async () => {
    if (!activeRide?.generatedRidesId) return;
    try {
      setFinishingAction('normal');
      setPollingEnabled(false);

      // ── 1. CAPTURE while the view is still mounted ─────────────────────
      if (preparePolygonView) await preparePolygonView();

      const capture = await captureRideSnapshot({
        containerRef: snapshotContainerRef,
        generatedRidesId: activeRide.generatedRidesId,
      });

      // ── 2. FINISH — creates PersonalFinishedRide record ─────────────────
      const data = await finishRide(activeRide.generatedRidesId);
      stopPolling();

      // ── 3. UPLOAD + save URL to PersonalFinishedRide (record now exists)
      let snapshotUrl = null;

      if (!capture.skipped) {
        snapshotUrl = await finishedRideService.uploadPersonalSnapshot(
          activeRide.generatedRidesId,
          {
            uri: capture.snapshotUri,
            type: 'image/png',
            fileName: `snapshot-${activeRide.generatedRidesId}-${Date.now()}.png`,
          },
        ).catch(e => { console.warn('[Snapshot] upload failed:', e?.message); return null; });
      }

      onRideFinished?.(data, snapshotUrl);
    } catch (err) {
      setPollingEnabled(true);
      Alert.alert('Could not finish ride', err.message || 'Please try again.');
    } finally {
      setFinishingAction(null);
    }
  }, [activeRide, stopPolling, setPollingEnabled, onRideFinished,
    snapshotContainerRef, preparePolygonView]);


  const handleForceFinishRide = useCallback(async (endForAll = false) => {
    if (!activeRide?.generatedRidesId) return;
    try {
      setFinishingAction('force');
      setPollingEnabled(false);

      // ── 1. CAPTURE ───────────────────────────────────────────────────────
      if (preparePolygonView) await preparePolygonView();

      const capture = await captureRideSnapshot({
        containerRef: snapshotContainerRef,
        generatedRidesId: activeRide.generatedRidesId,
      });

      // ── 2. FINISH ─────────────────────────────────────────────────────────
      const data = endForAll
        ? await forceFinishRide(activeRide.generatedRidesId)
        : await forceFinishOwnRide(activeRide.generatedRidesId);
      stopPolling();

      // ── 3. UPLOAD to PersonalFinishedRide ───────────────────────────────
      let snapshotUrl = null;

      if (!capture.skipped) {
        snapshotUrl = await finishedRideService.uploadPersonalSnapshot(
          activeRide.generatedRidesId,
          {
            uri: capture.snapshotUri,
            type: 'image/png',
            fileName: `snapshot-${activeRide.generatedRidesId}-${Date.now()}.png`,
          },
        ).catch(e => { console.warn('[Snapshot] upload failed:', e?.message); return null; });
      }

      onRideFinished?.(data, snapshotUrl);
    } catch (err) {
      setPollingEnabled(true);
      Alert.alert('Could not force-end ride', err.message || 'Please try again.');
    } finally {
      setFinishingAction(null);
    }
  }, [activeRide, stopPolling, setPollingEnabled, onRideFinished,
    snapshotContainerRef, preparePolygonView]);

  return {
    isFinishing,
    handleFinishRide,
    finishingAction,
    handleForceFinishRide,
  };
};