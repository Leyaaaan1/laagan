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
            const response = await joinService.createJoinRequest(generatedRidesId, token);
            setSuccess(true);
            Alert.alert(
                'Request Sent',
                'Success! Your request to join this ride is now pending approval.',
                [{ text: 'OK' }]
            );
            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(response);
            }
        } catch (error) {
            let errorMessage = 'Failed to join the ride. Please try again.';
            if (error.message.includes('409')) {
                errorMessage = "You've already sent a request to join this ride.";
            }
            setError(errorMessage);
            Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, success, joinRide };
};

export default useJoinRide;
