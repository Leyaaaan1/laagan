import {useState, useEffect, useCallback, useRef} from 'react';
import {Alert, Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {getRouteCoordinates} from '../../services/RouteService';
import {useAuth} from '../../context/AuthContext';
import {checkNetworkStatus} from '../offlineUtils';

export const useRouteMapLogic = generatedRidesId => {
  const {} = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // ── getUserLocationOnce ───────────────────────────────────────────────────
  const getUserLocationOnce = useCallback(() => {
    const quickOptions = {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 60000,
    };
    const accurateOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    };

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setUserLocation({lat: latitude, lng: longitude});
      },
      () => {
        // Quick location failed — retry with GPS
        Geolocation.getCurrentPosition(
          position => {
            const {latitude, longitude} = position.coords;
            setUserLocation({lat: latitude, lng: longitude});
          },
          err =>
          accurateOptions,
        );
      },
      quickOptions,
    );
  }, []);

  // ── requestLocationPermission ─────────────────────────────────────────────
  const requestLocationPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to your location to show your position on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getUserLocationOnce();
        } else {
        }
      } else {
        // iOS — permissions handled via Info.plist
        getUserLocationOnce();
      }
    } catch (err) {
    }
  }, [getUserLocationOnce]);

  // ── fetchRouteData ────────────────────────────────────────────────────────
  const fetchRouteData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setRouteError(null);

      // ✅ FIXED: Single network check call (cached for 5 seconds)
      const networkStatus = await checkNetworkStatus();
      setIsOfflineMode(!networkStatus.isConnected);

      if (!networkStatus.isConnected) {
      }

      const data = await getRouteCoordinates(generatedRidesId);

      if (!data) {
        throw new Error('No route data received');
      }

      setRouteData(data);
      setError(null);
      setRouteError(null);
    } catch (err) {
      const message = err?.message || 'Failed to load route data';

      // Fatal errors: Session expired
      if (err?.status === 401 || err?.status === 403) {
        setError('Session expired. Please log in again.');
        setRouteData(null);
        setRouteError(null);
        Alert.alert(
          'Session Expired',
          'Your login session has expired. Please log in again.',
          [{text: 'OK', style: 'default'}],
        );
      }
      // Offline scenario - show warning but allow map to display
      else if (
        isOfflineMode &&
        (message.includes('Network request failed') ||
          message.includes('NETWORK_ERROR'))
      ) {
        setRouteError('Offline — showing cached route');
        setError(null);
        setIsLoading(false);
        return;
      }
      // Non-fatal errors: GraphHopper rate limit, network issues, etc.
      else if (
        message.includes('GraphHopper') ||
        message.includes('rate limit') ||
        message.includes('API error') ||
        message.includes('Network request failed')
      ) {
        setRouteError(message);
        setRouteData(null);
        setError(null);
        setIsLoading(false);

        const alertMessage = isOfflineMode
          ? 'No internet connection. Cached landmarks will be displayed if available.'
          : 'The route cannot be loaded right now, but landmarks will be displayed.';

        Alert.alert('Route Unavailable', alertMessage, [
          {text: 'Retry', onPress: () => fetchRouteData()},
          {text: 'Continue Anyway', style: 'default'},
        ]);
        return;
      }
      // Other errors
      else {
        setError(message);
        setRouteError(null);
        setRouteData(null);
        Alert.alert('Route Loading Error', message, [
          {text: 'Retry', onPress: () => fetchRouteData()},
          {text: 'Cancel', style: 'cancel'},
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [generatedRidesId, isOfflineMode]);

  // ── Main effect ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (generatedRidesId) {
      fetchRouteData();
    } else {
      setIsLoading(false);
      setError('No route ID provided');
    }

    requestLocationPermission();
  }, [generatedRidesId, fetchRouteData, requestLocationPermission]);

  // ── updateUserLocationOnMap ───────────────────────────────────────────────
  const updateUserLocationOnMap = useCallback((webViewRef, location) => {
    if (!webViewRef.current || !location) return;

    const script = `      window.userCurrentLocation = ${JSON.stringify(
      location,
    )};
      if (typeof window.updateUserLocation === 'function') {
        window.updateUserLocation(${JSON.stringify(location)});
      }
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  }, []);

  // ── handleWebViewLoad ─────────────────────────────────────────────────────
  const handleWebViewLoad = useCallback(
    (
      webViewRef,
      routeData,
      startingPoint,
      endingPoint,
      stopPoints,
      userLocation,
    ) => {
      if (!webViewRef.current) return;

      const script = `
      if (typeof window.loadRouteData === 'function') {
        window.loadRouteData(
          ${JSON.stringify(routeData)},
          ${JSON.stringify(startingPoint)},
          ${JSON.stringify(endingPoint)},
          ${JSON.stringify(stopPoints)},
          ${JSON.stringify(userLocation)}
        );
      } else {
      }
      true;
    `;
      webViewRef.current.injectJavaScript(script);
    },
    [],
  );
  // ── handleWebViewMessage ──────────────────────────────────────────────────
  const routeDataRef = useRef(routeData);
  useEffect(() => {
    routeDataRef.current = routeData;
  }, [routeData]);

  const handleWebViewMessage = useCallback(
    (event, _setError, onWebViewLoad) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);
        if (message.type === 'mapReady') {
          if (routeDataRef.current) {
            onWebViewLoad();
          }
        }
      } catch (err) {
      }
    },
    [],
  );

  // ── handleWebViewError ────────────────────────────────────────────────────
  const handleWebViewError = useCallback(syntheticEvent => {
    console.error('WebView error:', syntheticEvent.nativeEvent);
  }, []);

  return {
    isLoading,
    routeData,
    error,
    routeError,
    userLocation,
    isOfflineMode,
    fetchRouteData,
    handleWebViewLoad,
    handleWebViewMessage,
    handleWebViewError,
    updateUserLocationOnMap,
  };
};
