import { useState, useEffect } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { getRouteCoordinates } from '../../services/RouteService';

export const useRouteMapLogic = (generatedRidesId, token) => {
  const [isLoading, setIsLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (generatedRidesId) {
      fetchRouteData();
    } else {
      console.warn('No generatedRidesId provided');
      setIsLoading(false);
      setError('No route ID provided');
    }

    // Get user location once
    requestLocationPermission();
  }, [generatedRidesId, token]);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show your position on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getUserLocationOnce();
        } else {
          console.log('Location permission denied');
        }
      } else {
        // iOS - permissions handled via Info.plist
        getUserLocationOnce();
      }
    } catch (err) {
      console.warn('Error requesting location permission:', err);
    }
  };

  const getUserLocationOnce = () => {
    console.log('Attempting to get user location...');

    // Strategy: Try quick location first, fallback to high accuracy if needed
    const quickOptions = {
      enableHighAccuracy: false,  // Use network/WiFi for speed
      timeout: 5000,
      maximumAge: 60000  // Accept cached location up to 1 minute old
    };

    const accurateOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    // First attempt: Quick location (network-based)
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        console.log('Quick location acquired:', latitude, longitude);
      },
      (error) => {
        console.log('Quick location failed, trying high accuracy...', error.message);

        // Second attempt: High accuracy GPS
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            console.log('High accuracy location acquired:', latitude, longitude);
          },
          (error) => {
            console.warn('Location acquisition failed:', error.message);
            // Don't show alert - just log the error
            // The map will work without user location marker
          },
          accurateOptions
        );
      },
      quickOptions
    );
  };

  const fetchRouteData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getRouteCoordinates(token, generatedRidesId);

      if (!data) {
        throw new Error('No route data received from server');
      }

      setRouteData(data);
      console.log('Route data loaded successfully:', data);

    } catch (error) {
      const errorMessage = error.message || 'Failed to load route data';
      setError(errorMessage);
      Alert.alert(
        'Route Loading Error',
        errorMessage,
        [
          { text: 'Retry', onPress: () => fetchRouteData() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebViewLoad = (webViewRef, routeData, startingPoint, endingPoint, stopPoints, userLocation) => {
    console.log('WebView loaded');
    console.log('Injecting points:', { startingPoint, endingPoint, stopPoints });

    if (webViewRef.current && routeData) {
      console.log('Injecting route data into WebView');

      const script = `
                console.log('=== INJECTION START ===');
                console.log('Received startingPoint:', ${JSON.stringify(startingPoint)});
                console.log('Received endingPoint:', ${JSON.stringify(endingPoint)});
                console.log('Received stopPoints:', ${JSON.stringify(stopPoints)});
                
                if (typeof window.loadRouteData === 'function') {
                    window.loadRouteData(
                        ${JSON.stringify(routeData)},
                        ${JSON.stringify(startingPoint)},
                        ${JSON.stringify(endingPoint)},
                        ${JSON.stringify(stopPoints)},
                        ${JSON.stringify(userLocation)}
                    );
                    console.log('loadRouteData called');
                } else {
                    console.error('loadRouteData function not available');
                }
                true;
            `;

      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleWebViewMessage = (event, setError, handleWebViewLoad) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', message);

      if (message.type === 'error') {
        console.error('Map error:', message.message);
        setError(message.message);
      } else if (message.type === 'mapReady') {
        console.log('Map is ready');
        if (routeData) {
          handleWebViewLoad();
        }
      } else if (message.type === 'routeLoaded') {
        console.log('Route loaded successfully:', message);
      }
    } catch (error) {
      console.log('Non-JSON WebView message:', event.nativeEvent.data);
    }
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
  };

  return {
    isLoading,
    routeData,
    error,
    userLocation,
    fetchRouteData,
    handleWebViewLoad,
    handleWebViewMessage,
    handleWebViewError,
  };
};