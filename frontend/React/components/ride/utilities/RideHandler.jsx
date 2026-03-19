// React/components/ride/RideHandler.jsx
import { useState } from 'react';
import { Alert } from 'react-native';
import { joinService } from '../../../services/joinService';

const useJoinRide = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

  const joinRide = async (generatedRidesId, token, onSuccess) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await joinService.joinRideById(generatedRidesId, token);

      setSuccess(true);
      Alert.alert('Request Sent', 'Your request to join this ride is now pending approval.', [{ text: 'OK' }]);
      onSuccess?.(response);
    } catch (error) {
      let errorMessage = 'Failed to join the ride. Please try again.';
      if (error.message.includes('already')) {
        errorMessage = "You've already sent a request to join this ride.";
      }
      setError(errorMessage);
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };
  const joinViaQr = async (inviteToken, token, onSuccess) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await joinService.joinViaQrCode(inviteToken, token);
      setSuccess(true);
      Alert.alert('Success', 'You joined the ride!');
      onSuccess?.(response);
    } catch (error) {
      setError(error.message);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, success, joinRide, joinViaQr };
};



export default useJoinRide;
