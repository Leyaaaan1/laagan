import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {finishRide, forceFinishRide} from '../../../services/startService';

/**
 * Custom hook to handle finish and force-finish ride logic.
 *
 * Mirrors the pattern of useStartedRideHandler (leave flow):
 *   - Owns its own loading state
 *   - Handles Alert confirmation for the destructive force-finish action
 *   - Calls stopPolling + setPollingEnabled(false) before the API request
 *   - Delegates navigation/data passing to the caller via callbacks
 *
 * @param {object}   activeRide          - The current active ride object
 * @param {function} stopPolling         - Stops the live-location polling
 * @param {function} setPollingEnabled   - Disables polling flag
 * @param {function} onRideFinished      - (finishedRideData) => void — navigates to summary
 */
export const useFinishRideHandler = (
  activeRide,
  stopPolling,
  setPollingEnabled,
  onRideFinished,
) => {
  const [isFinishing, setIsFinishing] = useState(false);

  // ── Normal finish (creator reached ending point) ──────────────
  const handleFinishRide = useCallback(async () => {
    if (!activeRide?.generatedRidesId) return;
    try {
      setIsFinishing(true);
      setPollingEnabled(false);
      const data = await finishRide(activeRide.generatedRidesId);
      stopPolling();
      onRideFinished?.(data);
    } catch (err) {
      setPollingEnabled(true);
      Alert.alert('Could not finish ride', err.message || 'Please try again.');
    } finally {
      setIsFinishing(false);
    }
  }, [activeRide, stopPolling, setPollingEnabled, onRideFinished]);

  // ── Force finish (creator ends ride for everyone immediately) ──
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
              onRideFinished?.(data);
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
  }, [activeRide, stopPolling, setPollingEnabled, onRideFinished]);

  return {isFinishing, handleFinishRide, handleForceFinishRide};
};
