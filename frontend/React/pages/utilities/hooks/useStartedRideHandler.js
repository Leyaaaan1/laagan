import {useState, useCallback, useContext} from 'react';
import {Alert} from 'react-native';
import {startService} from '../../../services/startService';
import {buildRideStep4Params} from '../../../utilities/NavigationParamsBuilder';
import {useNavigation} from '@react-navigation/native';
import {RideContext} from '../../../context/RideContext'; // ← ADD
import {routeCache} from '../../../services/cache/routeCache'; // ← ADD

export const useStartedRideHandler = (
  activeRide,
  username,
  stopPolling,
  setPollingEnabled,
) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const navigation = useNavigation();
  const {clearActiveRide} = useContext(RideContext); // ← ADD

  const handleLeaveRide = useCallback(() => {
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

              // Clear context + AsyncStorage so RiderPage never shows a stale ride
              clearActiveRide(); // ← ADD
              await routeCache.clear(activeRide.generatedRidesId); // ← ADD

              const params = buildRideStep4Params(activeRide, username);
              navigation.reset({
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
                error.message || 'Failed to leave the ride. Please try again.',
              );
            } finally {
              setIsLeaving(false);
            }
          },
        },
      ],
      {cancelable: true},
    );
  }, [
    activeRide,
    username,
    stopPolling,
    setPollingEnabled,
    navigation,
    clearActiveRide,
  ]); // ← add clearActiveRide

  return {isLeaving, handleLeaveRide};
};
