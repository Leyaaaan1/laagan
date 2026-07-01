import {useEffect, useRef, useState} from 'react';
import {Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {DEFAULT_COORDS, GEOLOCATION_OPTIONS} from '../utilities/route/map/appDefaults';

/**
 * Hook to fetch user's current location
 * Falls back to DEFAULT_COORDS if unable to fetch
 */

if (Platform.OS === 'android') {
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    locationProvider: 'android',
  });
}
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
      console.log('[useUserLocation] starting permission flow…');
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
          console.log('[useUserLocation] permission result:', granted);

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            throw new Error('Location permission denied');
          }
        }

        console.log('[useUserLocation] calling getCurrentPosition (fast)…');
        // Try fast location first
        await new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(
            position => {
              console.log(
                '[useUserLocation] fast lookup SUCCESS:',
                position.coords,
              );
              const {latitude, longitude} = position.coords;
              setLocation({
                latitude,
                longitude,
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
        console.warn(
          '[useUserLocation] fast lookup failed:',
          err?.message || err,
        );

        // Try accurate GPS as fallback
        try {
          console.log(
            '[useUserLocation] calling getCurrentPosition (accurate)…',
          );
          await new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
              position => {
                console.log(
                  '[useUserLocation] accurate lookup SUCCESS:',
                  position.coords,
                );
                const {latitude, longitude} = position.coords;
                setLocation({
                  latitude,
                  longitude,
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
            '[useUserLocation] accurate lookup failed:',
            err2?.message || err2,
          );
          setError(err2.message);
          // Keep the default coordinates that were set in useState
        }
      } finally {
        console.log('[useUserLocation] flow finished, loading=false');
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
