import React, { useState, useEffect, useRef } from 'react';
import { View, Alert } from 'react-native';
import {
  searchLocation,
  searchCityOrLandmark,
  createRide,
  reverseGeocodeLandmark,
  reverseGeocode,
  getLocationImage,
} from '../services/rideService';
import RideStep1 from '../components/ride/RideStep1';
import RideStep2 from '../components/ride/RideStep2';
import RideStep3 from '../components/ride/RideStep3';
import RideStep4 from '../components/ride/RideStep4';

const CreateRide = ({ route, navigation }) => {
  const { token, username } = route.params;
  const webViewRef = useRef(null);
  const pendingRideIdRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const [rideName, setRideName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [riderType, setRiderType] = useState('CAR');
  const [date, setDate] = useState(new Date());
  const [latitude, setLatitude] = useState('7.0731');
  const [longitude, setLongitude] = useState('125.6128');
  const [locationSelected, setLocationSelected] = useState(false);

  const [participants, setParticipants] = useState('');
  const [description, setDescription] = useState('');

  const [startingPoint, setStartingPoint] = useState('');
  const [startingLatitude, setStartingLatitude] = useState('7.0731');
  const [startingLongitude, setStartingLongitude] = useState('125.6128');

  const [endingPoint, setEndingPoint] = useState('');
  const [endingLatitude, setEndingLatitude] = useState('7.0731');
  const [endingLongitude, setEndingLongitude] = useState('125.6128');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [generatedRidesId, setGeneratedRidesId] = useState(null);
  const [rideNameImage, setRideNameImage] = useState([]);

  const [mapMode, setMapMode] = useState('starting');
  const [mapRegion, setMapRegion] = useState({
    latitude: 7.0731,
    longitude: 125.6128,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  console.log('CreateRide token:', token);
  // Stop Points State
  const [stopPoints, setStopPoints] = useState([]);

  useEffect(() => {
    if (currentStep === 2) { setMapMode('location'); }
    else if (currentStep === 3) { setMapMode('starting'); }
  }, [currentStep]);

  // ─── Map tap / drag handler (needs reverse geocode — no name available) ───
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'mapClick' || data.type === 'markerDrag') {
        const lat = data.lat;
        const lng = data.lng;

        if (mapMode === 'location') {
          setLatitude(lat.toString());
          setLongitude(lng.toString());
          // Tap on map → no display_name → reverse geocode is correct here
          reverseGeocodeLandmark(token, lat, lng)
            .then(name => { if (name) { setLocationName(name); } })
            .catch(err => console.log('Error reverse geocoding:', err));
        } else if (mapMode === 'starting') {
          setStartingLatitude(lat.toString());
          setStartingLongitude(lng.toString());
          reverseGeocode(token, lat, lng)
            .then(name => { if (name) { setStartingPoint(name); } })
            .catch(err => console.log('Error reverse geocoding:', err));
        } else if (mapMode === 'ending') {
          setEndingLatitude(lat.toString());
          setEndingLongitude(lng.toString());
          reverseGeocode(token, lat, lng)
            .then(name => { if (name) { setEndingPoint(name); } })
            .catch(err => console.log('Error reverse geocoding:', err));
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  // Called by RideStep2 & RideStep3 search inputs (debounced from child)
  const handleSearchInputChange = (value) => {
    setLocationSelected(false); // reset so new searches aren't blocked
    setSearchQuery(value);
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (!locationSelected && searchQuery && searchQuery.trim() && searchQuery.length >= 3) {
        setIsSearching(true);
        const searchFunc = mapMode === 'location'
          ? searchCityOrLandmark
          : searchLocation;
        searchFunc(token, searchQuery)
          .then(data => setSearchResults(data))
          .catch(() => Alert.alert('Error', 'Failed to search locations'))
          .finally(() => setIsSearching(false));
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayedSearch);
  }, [searchQuery, locationSelected, mapMode, token]);

  // ─── Search result selection (display_name already available — NO reverse geocode) ───
  const handleLocationSelect = async (location) => {
    console.log('Location selected:', location);
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lng);
    setLocationSelected(true);

    // Use the display_name from the search result directly.
    // The first segment (before the first comma) is the landmark / barangay name.
    // We do NOT call reverseGeocode here — that re-encodes coords back to a
    // string and can return raw "lat, lon" text when the backend has no match.
    const selectedName = location.display_name
      ? location.display_name.split(',')[0].trim()
      : `${lat}, ${lon}`;

    if (mapMode === 'location') {
      setLatitude(lat.toString());
      setLongitude(lon.toString());
      setLocationName(selectedName);

      // Fetch location images using the clean name
      try {
        const images = await getLocationImage(selectedName, token);
        setRideNameImage(images);
      } catch (error) {
        console.error('Error fetching location images:', error);
        setRideNameImage([]);
      }
    } else if (mapMode === 'starting') {
      setStartingLatitude(lat.toString());
      setStartingLongitude(lon.toString());
      setStartingPoint(selectedName);
      // Automatically move to ending mode after start is picked
      setMapMode('ending');
    } else if (mapMode === 'ending') {
      setEndingLatitude(lat.toString());
      setEndingLongitude(lon.toString());
      setEndingPoint(selectedName);
    }

    setSearchQuery(selectedName);
    setSearchResults([]);
    setMapRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    // Return the name so RideStep3's handleSelectLocationAndUpdateMap can use it
    return selectedName;
  };

  const handleCreateRide = async () => {
    if (!rideName.trim()) { setError('Ride name is required'); return; }
    if (!startingPoint.trim()) { setError('Starting point is required'); return; }
    if (!endingPoint.trim()) { setError('Ending point is required'); return; }
    if (date < new Date()) { setError('Ride date must be in the future'); return; }

    setLoading(true);
    setError('');

    const participantsArray = Array.isArray(participants)
      ? participants
      : (typeof participants === 'string' && participants.trim()
        ? participants.split(',').map(p => p.trim())
        : []);

    // Prepare stopPoints for backend (lat, lng, name)
    const stopPointsPayload = stopPoints.map(sp => ({
      stopLatitude: sp.lat || sp.stopLatitude,
      stopLongitude: sp.lng || sp.stopLongitude,
      stopName: sp.name || sp.stopName,
    }));

    try {
      if (!token) {
        throw new Error('No authentication token available. Please log in again.');
      }

      const rideData = {
        ridesName: rideName,
        locationName: locationName,
        riderType: riderType || 'CAR',
        date: date.toISOString(),
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        startLat: parseFloat(startingLatitude) || 0,
        startLng: parseFloat(startingLongitude) || 0,
        endLat: parseFloat(endingLatitude) || 0,
        endLng: parseFloat(endingLongitude) || 0,
        startingPoint: startingPoint,
        endingPoint: endingPoint,
        participants: participantsArray,
        description: description,
        stopPoints: stopPointsPayload,
      };

      console.log('Making createRide API call...');
      const result = await createRide(rideData, token);
      console.log('CreateRide API response:', result);

      let generatedId = null;

      if (result && typeof result === 'object') {
        generatedId = result.generatedRidesId ||
          result.ridesId ||
          result.rideId ||
          result.id ||
          result.generatedId;
      } else if (typeof result === 'string') {
        generatedId = result;
      }

      console.log('Extracted generated ID:', generatedId);

      if (generatedId) {
        setGeneratedRidesId(generatedId);
        console.log('Navigating to RideStep4 with ID:', generatedId);
        setCurrentStep(4);
        pendingRideIdRef.current = generatedId;
      } else {
        console.error('No valid ride ID found in response:', result);
        setError('Ride was created but no ID was returned. Response: ' + JSON.stringify(result));
        Alert.alert('Warning', 'Ride was created but ID is missing. Please check with support.');
      }
    } catch (err) {
      console.error('Error creating ride:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      let errorMessage = 'An error occurred while creating the ride.';

      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => { if (currentStep < 4) { setCurrentStep(currentStep + 1); } };
  const prevStep = () => { if (currentStep > 1) { setCurrentStep(currentStep - 1); } };

  return (
    <View style={{ flex: 1 }}>
      {currentStep === 1 && (
        <RideStep1
          error={error}
          rideName={rideName}
          setRideName={setRideName}
          riderType={riderType}
          setRiderType={setRiderType}
          participants={participants}
          setParticipants={setParticipants}
          description={description}
          setDescription={setDescription}
          setDate={setDate}
          date={date}
          nextStep={nextStep}
        />
      )}
      {currentStep === 2 && (
        <RideStep2
          isSearching={isSearching}
          searchResults={searchResults}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleLocationSelect={handleLocationSelect}
          handleSearchInputChange={handleSearchInputChange}
          webViewRef={webViewRef}
          latitude={latitude}
          longitude={longitude}
          handleMessage={handleMessage}
          locationName={locationName}
          setLocationName={setLocationName}
          prevStep={prevStep}
          nextStep={nextStep}
          token={token}
        />
      )}
      {currentStep === 3 && (
        <RideStep3
          stopPoints={stopPoints}
          setStopPoints={setStopPoints}
          mapMode={mapMode}
          setMapMode={setMapMode}
          isSearching={isSearching}
          searchResults={searchResults}
          handleLocationSelect={handleLocationSelect}
          handleSearchInputChange={handleSearchInputChange}
          webViewRef={webViewRef}
          startingLatitude={startingLatitude}
          startingLongitude={startingLongitude}
          endingLatitude={endingLatitude}
          endingLongitude={endingLongitude}
          handleMessage={handleMessage}
          startingPoint={startingPoint}
          setStartingPoint={setStartingPoint}
          endingPoint={endingPoint}
          setEndingPoint={setEndingPoint}
          prevStep={prevStep}
          nextStep={nextStep}
          handleCreateRide={handleCreateRide}
          loading={loading}
          searchQuery={searchQuery}
          token={token}
        />
      )}
      {currentStep === 4 && (generatedRidesId || pendingRideIdRef.current) && (
        <RideStep4
          generatedRidesId={generatedRidesId || pendingRideIdRef.current}
          rideName={rideName}
          locationName={locationName}
          riderType={riderType}
          date={date}
          startingPoint={startingPoint}
          endingPoint={endingPoint}
          participants={participants}
          description={description}
          token={token}
          username={username}
          stopPoints={stopPoints}
          currentUsername={username}
          startLat={parseFloat(startingLatitude) || 0}
          startLng={parseFloat(startingLongitude) || 0}
          endLat={parseFloat(endingLatitude) || 0}
          endLng={parseFloat(endingLongitude) || 0}
        />
      )}
    </View>
  );
};

export default CreateRide;