import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {startService} from '../../../services/startService';
import {buildRideStep4Params} from '../../../utilities/NavigationParamsBuilder';
import {useNavigation} from '@react-navigation/native';
import {finishedRideService} from '../../../services/finishedRideService';

/** * Custom hook to handle stop ride logic */
export const useStartedRideHandler = (
  activeRide,
  username,
  stopPolling,
  setPollingEnabled,
) => {
  const [isStopping, setIsStopping] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const navigation = useNavigation();

  const handleLeaveRide = useCallback(
    () => {
      // ← no parameter
      Alert.alert(
        'Leave Ride',
        'Are you sure you want to leave this ride?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Leave Ride',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLeaving(true);
                setPollingEnabled(false);
                await startService.leaveRide(activeRide.generatedRidesId);
                stopPolling();
                const params = buildRideStep4Params(activeRide, username);
                navigation.reset({
                  // ← uses useNavigation() from hook scope
                  index: 1,
                  routes: [
                    {name: 'RiderPage', params: {username}},
                    {name: 'RideStep4', params},
                  ],
                });
              } catch (error) {
                setPollingEnabled(true);
                Alert.alert(
                  'Error',
                  error.message ||
                    'Failed to leave the ride. Please try again.',
                );
              } finally {
                setIsLeaving(false);
              }
            },
          },
        ],
        {cancelable: true},
      );
    },
    [activeRide, username, stopPolling, setPollingEnabled, navigation], // ← add navigation
  );

  return {isLeaving, handleLeaveRide};
};
