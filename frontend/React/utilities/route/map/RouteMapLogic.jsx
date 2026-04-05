import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { getRouteCoordinates } from '../../../services/RouteService';

export const useRouteMapLogic = (generatedRidesId, token) => {
  const [isLoading, setIsLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

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
            console.log(
              'High accuracy location acquired:',
              latitude,
              longitude,
            );
          },
          err =>
            console.warn('High accuracy location also failed:', err.message),
          accurateOptions,
        );
      },
      quickOptions,
    );
  }, []); // setUserLocation is stable — no extra deps needed

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
          console.log('Location permission denied');
        }
      } else {
        // iOS — permissions handled via Info.plist
        getUserLocationOnce();
      }
    } catch (err) {
      console.warn('Error requesting location permission:', err);
    }
  }, [getUserLocationOnce]);

  // ── fetchRouteData ────────────────────────────────────────────────────────
  // Previously had two bugs:
  //   1. `errorMessage` was used in the catch block but was never declared —
  //      the caught value is `error` (the parameter), not `errorMessage`.
  //   2. The function was a plain `const` inside the hook body, so ESLint
  //      (correctly) complained it was missing from the useEffect dep array.
  //      Wrapping in useCallback gives it a stable identity.
  const fetchRouteData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getRouteCoordinates(
        tokenRef.current,
        generatedRidesId,
      );

      // ✅ NEW: Check response status for token expiry
      // (Note: getRouteCoordinates likely returns a response object.
      // Check what it actually returns and add this check accordingly)

      if (!data) {
        throw new Error('No route data received from server');
      }

      setRouteData(data);
    } catch (err) {
      const message = err?.message || 'Failed to load route data';

      // ✅ NEW: Check if this is a 401/403 error
      if (err?.status === 401 || err?.status === 403) {
        setError('Session expired. Please log in again.');
        // DO NOT show a retry button for 401/403
        Alert.alert(
          'Session Expired',
          'Your login session has expired. Please log in again.',
          [{text: 'OK', style: 'default'}],
        );
      } else {
        // For other errors, keep the retry logic
        setError(message);
        Alert.alert('Route Loading Error', message, [
          {text: 'Retry', onPress: () => fetchRouteData()},
          {text: 'Cancel', style: 'cancel'},
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [generatedRidesId]);
  // tokenRef is a ref — stable, does not need to be listed

  // ── Main effect: fetch route + request location on mount / id change ──────
  useEffect(() => {
    if (generatedRidesId) {
      fetchRouteData();
    } else {
      console.warn('No generatedRidesId provided');
      setIsLoading(false);
      setError('No route ID provided');
    }

    requestLocationPermission();
  }, [generatedRidesId, fetchRouteData, requestLocationPermission]);
  // token is intentionally omitted — tokenRef.current gives fetchRouteData
  // the latest token without causing the effect to re-run on every token change.

  // ── updateUserLocationOnMap ───────────────────────────────────────────────
  const updateUserLocationOnMap = useCallback((webViewRef, location) => {
    if (!webViewRef.current || !location) return;

    const script = `
      window.userCurrentLocation = ${JSON.stringify(location)};
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
      if (!webViewRef.current || !routeData) return;

      const script = `
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
    },
    [],
  );

  // ── handleWebViewMessage ──────────────────────────────────────────────────
  // routeData is read from state inside here — we use a ref so the callback
  // stays stable without needing routeData in its deps (which would make
  // RouteMapView re-register the onMessage handler on every fetch).
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
        // 'error' and 'routeLoaded' types handled silently for now
      } catch (err) {
        console.warn('WebView message parse error:', err);
      }
    },
    [],
  ); // stable — reads routeData via ref

  // ── handleWebViewError ────────────────────────────────────────────────────
  const handleWebViewError = useCallback(syntheticEvent => {
    console.error('WebView error:', syntheticEvent.nativeEvent);
  }, []);

  return {
    isLoading,
    routeData,
    error,
    userLocation,
    fetchRouteData,
    handleWebViewLoad,
    handleWebViewMessage,
    handleWebViewError,
    updateUserLocationOnMap,
  };
};