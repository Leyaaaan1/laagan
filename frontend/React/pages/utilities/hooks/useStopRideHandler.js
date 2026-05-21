import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {startService} from '../../../services/startService';
import {buildRideStep4Params} from '../../../utilities/NavigationParamsBuilder';

/** * Custom hook to handle stop ride logic */
export const useStopRideHandler = (
  activeRide,
  username,
  stopPolling,
  setPollingEnabled,
) => {
  const [isStopping, setIsStopping] = useState(false);

  const handleStopRide = useCallback(
    navigation => {
      Alert.alert(
        'Stop Ride',
        'Are you sure you want to stop this ride? This action cannot be undone.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Stop Ride',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsStopping(true);
                setPollingEnabled(false); // Stop polling immediately

                await startService.deactivateRide(activeRide.generatedRidesId);

                stopPolling(); // Explicit cleanup

                const params = buildRideStep4Params(activeRide, username);
                navigation.reset({
                  index: 1,
                  routes: [
                    {name: 'RiderPage', params: {username}},
                    {name: 'RideStep4', params},
                  ],
                });
              } catch (error) {
                setPollingEnabled(true); // Re-enable if error
                Alert.alert(
                  'Error',
                  error.message || 'Failed to stop the ride. Please try again.',
                );
              } finally {
                setIsStopping(false);
              }
            },
          },
        ],
        {cancelable: true},
      );
    },
    [activeRide, username, stopPolling, setPollingEnabled],
  );

  return {isStopping, handleStopRide};
};
