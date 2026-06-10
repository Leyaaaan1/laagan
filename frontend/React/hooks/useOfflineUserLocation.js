/**
 * useOfflineUserLocation.js
 *
 * Lightweight GPS hook for offline mode.
 * - Fetches location once on mount, then refreshes every REFRESH_INTERVAL_MS
 * - Stops refreshing when `enabled` is false (i.e. when back online,
 *   RouteMapView / useRideLocationPolling takes over)
 * - Stops refreshing when the app is backgrounded or closed (AppState listener)
 *   so GPS never runs outside the foreground — matching the privacy policy.
 * - Resumes automatically when the app returns to foreground (if still enabled)
 * - No network calls — pure Geolocation only
 * - Returns { lat, lng } to match the shape OfflineMapView's
 *   window.updateUserLocation() expects
 */

import {useState, useEffect, useRef, useCallback} from 'react';
import {AppState, Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

const REFRESH_INTERVAL_MS = 15000; // Re-poll GPS every 15 s (battery-friendly)

const GPS_OPTIONS_FAST = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 30000,
};

const GPS_OPTIONS_ACCURATE = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
};
export const useOfflineUserLocation = (enabled = true) => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const enabledRef = useRef(enabled);
  const appStateRef = useRef(AppState.currentState);

  // Keep enabledRef in sync so the AppState handler always sees the latest value
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const fetchLocation = useCallback(async () => {
    if (!mountedRef.current) return;

    // ── Android permission check (non-blocking — we already requested it
    //    in useRideLocationPolling / useUserLocation on mount) ──────────────
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (!granted) {
        setLocationError('Location permission not granted');
        return;
      }
    }

    // ── Try fast (network/wifi) location first ────────────────────────────
    Geolocation.getCurrentPosition(
      position => {
        if (!mountedRef.current) return;
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
        console.log(
          '📍 [Offline] User location (fast):',
          position.coords.latitude,
          position.coords.longitude,
        );
      },
      () => {
        // Fast fix failed — fall back to GPS
        Geolocation.getCurrentPosition(
          position => {
            if (!mountedRef.current) return;
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setLocationError(null);
            console.log(
              '📍 [Offline] User location (GPS):',
              position.coords.latitude,
              position.coords.longitude,
            );
          },
          err => {
            if (!mountedRef.current) return;
            console.warn('⚠️ [Offline] GPS fallback failed:', err.message);
            setLocationError(err.message);
          },
          GPS_OPTIONS_ACCURATE,
        );
      },
      GPS_OPTIONS_FAST,
    );
  }, []);

  // ── Helpers to start/stop the polling interval ──────────────────────────
  const startInterval = useCallback(() => {
    if (intervalRef.current) return; // already running
    fetchLocation();
    intervalRef.current = setInterval(fetchLocation, REFRESH_INTERVAL_MS);
    console.log('▶️ [Offline] GPS polling started');
  }, [fetchLocation]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ [Offline] GPS polling stopped');
    }
  }, []);

  // ── AppState listener — pause when backgrounded, resume on foreground ───
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      const isNowActive = nextState === 'active';
      const isNowBackground = nextState.match(/inactive|background/);

      if (wasBackground && isNowActive) {
        // App came back to foreground — resume only if still enabled
        if (enabledRef.current && mountedRef.current) {
          console.log('📲 [Offline] App foregrounded — resuming GPS polling');
          startInterval();
        }
      } else if (isNowBackground) {
        // App went to background — stop GPS immediately
        console.log('📲 [Offline] App backgrounded — pausing GPS polling');
        stopInterval();
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [startInterval, stopInterval]);

  // ── Main effect — respond to enabled flag changes ───────────────────────
  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      // Back online — hand off to useRideLocationPolling
      stopInterval();
      return;
    }

    // Only start polling if the app is currently in the foreground
    if (AppState.currentState === 'active') {
      startInterval();
    }

    return () => {
      mountedRef.current = false;
      stopInterval();
    };
  }, [enabled, startInterval, stopInterval]);

  return {userLocation, locationError};
};
