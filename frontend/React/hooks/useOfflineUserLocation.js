/**
 * useOfflineUserLocation.js
 *
 * Lightweight GPS hook for offline mode.
 * - Fetches location once on mount, then refreshes every REFRESH_INTERVAL_MS
 * - Stops refreshing when `enabled` is false (i.e. when back online,
 *   RouteMapView / useRideLocationPolling takes over)
 * - No network calls — pure Geolocation only
 * - Returns { lat, lng } to match the shape OfflineMapView's
 *   window.updateUserLocation() expects
 */

import {useState, useEffect, useRef, useCallback} from 'react';
import {Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

const REFRESH_INTERVAL_MS = 15000; // Re-poll GPS every 15 s (battery-friendly)

const GPS_OPTIONS_FAST = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 30000, // Accept a 30-second-old cached fix
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

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      // Clear any running interval when disabled (back online)
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch immediately on mount / when enabled flips to true
    fetchLocation();

    // Then refresh on a gentle interval
    intervalRef.current = setInterval(fetchLocation, REFRESH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, fetchLocation]);

  return {userLocation, locationError};
};
