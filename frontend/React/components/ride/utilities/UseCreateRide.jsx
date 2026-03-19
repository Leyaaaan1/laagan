/**
 * useCreateRide.js
 *
 * Custom hook that owns all state and side-effects for the CreateRide flow.
 * Extracted from CreateRide.jsx to keep the component purely presentational.
 *
 * Responsibilities:
 *  - All form field state (rideName, date, riderType, location coords, etc.)
 *  - Step navigation
 *  - Map mode management (location / starting / ending)
 *  - Debounced location search
 *  - Location selection (search result or map tap)
 *  - Ride creation API call
 */

import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import {
  searchLocation,
  searchCityOrLandmark,
  createRide,
  reverseGeocodeLandmark,
  reverseGeocode,
  getLocationImage,
} from '../../../services/rideService';

// ─── Default coordinates (Davao City) ────────────────────────────────────────
const DEFAULT_LAT = '7.0731';
const DEFAULT_LNG = '125.6128';

const useCreateRide = ({ token, username }) => {
  const webViewRef       = useRef(null);
  const pendingRideIdRef = useRef(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [currentStep,  setCurrentStep]  = useState(1);

  // ── Ride details (Step 1) ─────────────────────────────────────────────────
  const [rideName,     setRideName]     = useState('');
  const [riderType,    setRiderType]    = useState('CAR');
  const [date,         setDate]         = useState(new Date());
  const [participants, setParticipants] = useState('');
  const [description,  setDescription] = useState('');

  // ── Destination / location (Step 2) ──────────────────────────────────────
  const [locationName,     setLocationName]     = useState('');
  const [latitude,         setLatitude]         = useState(DEFAULT_LAT);
  const [longitude,        setLongitude]        = useState(DEFAULT_LNG);
  const [locationSelected, setLocationSelected] = useState(false);
  const [rideNameImage,    setRideNameImage]    = useState([]);

  // ── Route points (Step 3) ─────────────────────────────────────────────────
  const [startingPoint,     setStartingPoint]     = useState('');
  const [startingLatitude,  setStartingLatitude]  = useState(DEFAULT_LAT);
  const [startingLongitude, setStartingLongitude] = useState(DEFAULT_LNG);
  const [endingPoint,       setEndingPoint]       = useState('');
  const [endingLatitude,    setEndingLatitude]    = useState(DEFAULT_LAT);
  const [endingLongitude,   setEndingLongitude]   = useState(DEFAULT_LNG);
  const [stopPoints,        setStopPoints]        = useState([]);

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching,   setIsSearching]   = useState(false);

  // ── Map ───────────────────────────────────────────────────────────────────
  const [mapMode, setMapMode] = useState('starting');

  // ── Step-based map mode sync ──────────────────────────────────────────────
  useEffect(() => {
    if      (currentStep === 2) { setMapMode('location'); }
    else if (currentStep === 3) { setMapMode('starting'); }
  }, [currentStep]);

  // ── Generated ride (Step 4) ───────────────────────────────────────────────
  const [generatedRidesId, setGeneratedRidesId] = useState(null);

  // ─── Step navigation ──────────────────────────────────────────────────────
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // ─── Map tap / drag ───────────────────────────────────────────────────────
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type !== 'mapClick' && data.type !== 'markerDrag') { return; }

      const { lat, lng } = data;

      if (mapMode === 'location') {
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        reverseGeocodeLandmark(token, lat, lng)
          .then(name => { if (name) { setLocationName(name); } })
          .catch(err => console.warn('Reverse geocode error:', err));

      } else if (mapMode === 'starting') {
        setStartingLatitude(lat.toString());
        setStartingLongitude(lng.toString());
        reverseGeocode(token, lat, lng)
          .then(name => { if (name) { setStartingPoint(name); } })
          .catch(err => console.warn('Reverse geocode error:', err));

      } else if (mapMode === 'ending') {
        setEndingLatitude(lat.toString());
        setEndingLongitude(lng.toString());
        reverseGeocode(token, lat, lng)
          .then(name => { if (name) { setEndingPoint(name); } })
          .catch(err => console.warn('Reverse geocode error:', err));
      }
    } catch (err) {
      console.error('handleMessage parse error:', err);
    }
  };

  // ─── Search input (debounced by the child component, raw value here) ──────
  const handleSearchInputChange = (value) => {
    setLocationSelected(false);
    setSearchQuery(value);
  };

  // ─── Trigger actual search after debounce settles ─────────────────────────
  useEffect(() => {
    const isValidQuery = searchQuery?.trim().length >= 3;
    if (!isValidQuery || locationSelected) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const searchFn = mapMode === 'location' ? searchCityOrLandmark : searchLocation;

    const timer = setTimeout(() => {
      searchFn(token, searchQuery)
        .then(data => setSearchResults(data))
        .catch(() => Alert.alert('Error', 'Failed to search locations'))
        .finally(() => setIsSearching(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, locationSelected, mapMode, token]);

  // ─── Location selection (from search result) ──────────────────────────────
  /**
   * Selects a location from search results and updates the relevant state
   * based on the current mapMode.
   *
   * Returns the resolved display name so RideStep3 can mirror it locally.
   */
  const handleLocationSelect = async (location) => {
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lng);
    setLocationSelected(true);

    // Use the display_name from the search result directly — no reverse
    // geocoding needed since we already have the name from Nominatim.
    const selectedName = location.display_name
      ? location.display_name.split(',')[0].trim()
      : `${lat}, ${lon}`;

    if (mapMode === 'location') {
      setLatitude(lat.toString());
      setLongitude(lon.toString());
      setLocationName(selectedName);
      getLocationImage(selectedName, token)
        .then(imgs => setRideNameImage(imgs))
        .catch(() => setRideNameImage([]));

    } else if (mapMode === 'starting') {
      setStartingLatitude(lat.toString());
      setStartingLongitude(lon.toString());
      setStartingPoint(selectedName);
      setMapMode('ending'); // auto-advance to ending after start is set

    } else if (mapMode === 'ending') {
      setEndingLatitude(lat.toString());
      setEndingLongitude(lon.toString());
      setEndingPoint(selectedName);
    }

    setSearchQuery(selectedName);
    setSearchResults([]);

    return selectedName;
  };

  // ─── Build stop-points payload for the API ────────────────────────────────
  const buildStopPointsPayload = () =>
    stopPoints.map(sp => ({
      stopLatitude:  sp.lat  ?? sp.stopLatitude,
      stopLongitude: sp.lng  ?? sp.stopLongitude,
      stopName:      sp.name ?? sp.stopName,
    }));

  // ─── Build participants array from either array or comma-string ───────────
  const buildParticipantsArray = () => {
    if (Array.isArray(participants)) { return participants; }
    if (typeof participants === 'string' && participants.trim()) {
      return participants.split(',').map(p => p.trim());
    }
    return [];
  };

  // ─── Ride creation ────────────────────────────────────────────────────────
  const handleCreateRide = async () => {
    // ── Validation ──
    if (!rideName.trim())      { setError('Ride name is required');       return; }
    if (!startingPoint.trim()) { setError('Starting point is required');  return; }
    if (!endingPoint.trim())   { setError('Ending point is required');    return; }
    if (date < new Date())     { setError('Ride date must be in the future'); return; }

    setLoading(true);
    setError('');

    const rideData = {
      ridesName:     rideName,
      locationName,
      riderType:     riderType || 'CAR',
      date:          date.toISOString(),
      latitude:      parseFloat(latitude)          || 0,
      longitude:     parseFloat(longitude)         || 0,
      startLat:      parseFloat(startingLatitude)  || 0,
      startLng:      parseFloat(startingLongitude) || 0,
      endLat:        parseFloat(endingLatitude)    || 0,
      endLng:        parseFloat(endingLongitude)   || 0,
      startingPoint,
      endingPoint,
      participants:  buildParticipantsArray(),
      description,
      stopPoints:    buildStopPointsPayload(),
    };

    try {
      const result = await createRide(rideData, token);

      const generatedId =
        result?.generatedRidesId ??
        result?.ridesId          ??
        result?.rideId           ??
        result?.id               ??
        result?.generatedId      ??
        (typeof result === 'string' ? result : null);

      if (generatedId) {
        setGeneratedRidesId(generatedId);
        pendingRideIdRef.current = generatedId;
        setCurrentStep(4);
      } else {
        const msg = 'Ride was created but no ID was returned.';
        setError(msg);
        Alert.alert('Warning', msg);
      }
    } catch (err) {
      const msg = resolveErrorMessage(err);
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    // refs
    webViewRef,
    pendingRideIdRef,
    // ui
    loading, error,
    currentStep, nextStep, prevStep,
    // step 1
    rideName, setRideName,
    riderType, setRiderType,
    date, setDate,
    participants, setParticipants,
    description, setDescription,
    // step 2
    locationName, setLocationName,
    latitude, longitude,
    locationSelected,
    rideNameImage,
    // step 3
    startingPoint, setStartingPoint,
    startingLatitude, startingLongitude,
    endingPoint, setEndingPoint,
    endingLatitude, endingLongitude,
    stopPoints, setStopPoints,
    // search
    searchQuery, setSearchQuery,
    searchResults,
    isSearching,
    handleSearchInputChange,
    handleLocationSelect,
    // map
    mapMode, setMapMode,
    handleMessage,
    // step 4
    generatedRidesId,
    // ride creation
    handleCreateRide,
  };
};

// ─── Helper: extract a human-readable error message ──────────────────────────
const resolveErrorMessage = (err) => {
  if (err.response?.data) {
    if (typeof err.response.data === 'string')   { return err.response.data; }
    if (err.response.data.message)               { return err.response.data.message; }
    return JSON.stringify(err.response.data);
  }
  if (err.message?.includes('Failed to fetch'))  { return 'Network connection failed. Please check your internet connection.'; }
  if (err.message?.includes('403'))              { return 'Authentication failed. Please try logging in again.'; }
  if (err.message?.includes('401'))              { return 'Access denied. Please log in again.'; }
  if (err.message?.includes('500'))              { return 'Server error. Please try again later.'; }
  return err.message || 'An error occurred while creating the ride.';
};

export default useCreateRide;