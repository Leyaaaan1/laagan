import {useEffect, useRef, useState} from 'react';
import {Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {DEFAULT_COORDS, GEOLOCATION_OPTIONS} from '../utilities/route/map/appDefaults';

/**
 * Hook to fetch user's current location
 * Falls back to DEFAULT_COORDS if unable to fetch
 */
export const useUserLocation = () => {
  const [location, setLocation] = useState({
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
    isDefault: true, // Flag to indicate if this is the fallback or real location
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchAttemptedRef = useRef(false);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        // Request permission on Android
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message:
                'This app needs access to your location to show your position on the map.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            throw new Error('Location permission denied');
          }
        }

        // Try fast location first
        await new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(
            position => {
              const {latitude, longitude} = position.coords;
              setLocation({
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                isDefault: false,
              });
              setError(null);
              resolve();
            },
            reject,
            GEOLOCATION_OPTIONS.fast,
          );
        });
      } catch (err) {
        console.warn('Fast location failed, trying accurate GPS:', err.message);

        // Try accurate GPS as fallback
        try {
          await new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
              position => {
                const {latitude, longitude} = position.coords;
                setLocation({
                  latitude: latitude.toString(),
                  longitude: longitude.toString(),
                  isDefault: false,
                });
                setError(null);
                resolve();
              },
              reject,
              GEOLOCATION_OPTIONS.accurate,
            );
          });
        } catch (err2) {
          console.warn(
            'Accurate GPS also failed, using default coordinates:',
            err2.message,
          );
          setError(err2.message);
          // Keep the default coordinates that were set in useState
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch once on mount
    if (!fetchAttemptedRef.current) {
      fetchAttemptedRef.current = true;
      requestLocationPermission();
    }
  }, []);

  return {location, loading, error};
};
