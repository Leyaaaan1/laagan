import {useState, useEffect, useRef} from 'react';
import {Alert} from 'react-native';
import {
  searchLocation,
  searchCityOrLandmark,
  createRide,
  reverseGeocodeLandmark,
  reverseGeocode,
  getLocationImage,
} from '../../services/rideService';
import {
  validateCoordinates,
  validateRideDate,
  validateRideName,
} from '../../utilities/validator/validationErrors';
import {
  ERROR_MESSAGES,
  resolveErrorMessage,
} from '../../utilities/validator/errorMessages';
import {SUCCESS_MESSAGES} from '../../utilities/validator/successMessages';
import {DEFAULT_COORDS} from '../../utilities/route/map/appDefaults';
import {useUserLocation} from '../../hooks/useUserLocation';

// ─── Default coordinates (Davao City) ────────────────────────────────────────
const DEFAULT_LAT = '7.0731';
const DEFAULT_LNG = '125.6128';

const useCreateRide = ({token, username}) => {
  const webViewRef = useRef(null);
  const pendingRideIdRef = useRef(null);

  const {location} = useUserLocation();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // ── Ride details (Step 1) ─────────────────────────────────────────────────
  const [rideName, setRideName] = useState('');
  const [riderType, setRiderType] = useState('CAR');
  const [date, setDate] = useState(new Date());
  const [participants, setParticipants] = useState('');
  const [description, setDescription] = useState('');

  // ── Destination / location (Step 2) ──────────────────────────────────────
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState(location.latitude);
  const [longitude, setLongitude] = useState(location.longitude);
  const [locationSelected, setLocationSelected] = useState(false);
  const [rideNameImage, setRideNameImage] = useState([]);

  useEffect(() => {
    setLatitude(location.latitude);
    setLongitude(location.longitude);
  }, [location]);

  // ── Route points (Step 3) ─────────────────────────────────────────────────
  const [startingPoint, setStartingPoint] = useState('');
  const [startingLatitude, setStartingLatitude] = useState(location.latitude);
  const [startingLongitude, setStartingLongitude] = useState(
    location.longitude,
  );
  const [endingPoint, setEndingPoint] = useState('');
  const [endingLatitude, setEndingLatitude] = useState(DEFAULT_COORDS.latitude);
  const [endingLongitude, setEndingLongitude] = useState(
    DEFAULT_COORDS.longitude,
  );
  const [stopPoints, setStopPoints] = useState([]);

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // ── Map ───────────────────────────────────────────────────────────────────
  const [mapMode, setMapMode] = useState('starting');

  // ── Step-based map mode sync ──────────────────────────────────────────────
  useEffect(() => {
    if (currentStep === 2) {
      setMapMode('location');
    } else if (currentStep === 3) {
      setMapMode('starting');
    }
  }, [currentStep]);

  // ── Generated ride (Step 4) ───────────────────────────────────────────────
  const [generatedRidesId, setGeneratedRidesId] = useState(null);

  // ─── Step navigation ──────────────────────────────────────────────────────
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // ─── Map tap / drag ───────────────────────────────────────────────────────
  const handleMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type !== 'mapClick' && data.type !== 'markerDrag') {
        return;
      }

      const {lat, lng} = data;

      if (mapMode === 'location') {
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        reverseGeocodeLandmark(lat, lng)
          .then(name => {
            if (name) {
              setLocationName(name);
            }
          })
          .catch(err => console.warn('Reverse geocode error:', err));
      } else if (mapMode === 'starting') {
        setStartingLatitude(lat.toString());
        setStartingLongitude(lng.toString());
        reverseGeocode(lat, lng)
          .then(name => {
            if (name) {
              setStartingPoint(name);
            }
          })
          .catch(err => console.warn('Reverse geocode error:', err));
      } else if (mapMode === 'ending') {
        setEndingLatitude(lat.toString());
        setEndingLongitude(lng.toString());
        reverseGeocode( lat, lng)
          .then(name => {
            if (name) {
              setEndingPoint(name);
            }
          })
          .catch(err => console.warn('Reverse geocode error:', err));
      }
    } catch (err) {
      console.error('handleMessage parse error:', err);
    }
  };

  // ─── Search input (debounced by the child component, raw value here) ──────
  const handleSearchInputChange = value => {
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
    const searchFn =
      mapMode === 'location' ? searchCityOrLandmark : searchLocation;

    const timer = setTimeout(() => {
      searchFn( searchQuery)
        .then(data => setSearchResults(data))
        .catch(() =>
          Alert.alert('Error', ERROR_MESSAGES.LOCATION.SEARCH_FAILED),
        )
        .finally(() => setIsSearching(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, locationSelected, mapMode]);

  // ─── Location selection (from search result) ──────────────────────────────
  const handleLocationSelect = async location => {
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);
    setLocationSelected(true);

    const selectedName = location.display_name
      ? location.display_name.split(',')[0].trim()
      : `${lat}, ${lon}`;

    if (mapMode === 'location') {
      setLatitude(lat.toString());
      setLongitude(lon.toString());
      setLocationName(selectedName);
      getLocationImage(selectedName)
        .then(imgs => setRideNameImage(imgs))
        .catch(() => setRideNameImage([]));
    } else if (mapMode === 'starting') {
      setStartingLatitude(lat.toString());
      setStartingLongitude(lon.toString());
      setStartingPoint(selectedName);
      setMapMode('ending');
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
      stopLatitude: sp.lat ?? sp.stopLatitude,
      stopLongitude: sp.lng ?? sp.stopLongitude,
      stopName: sp.name ?? sp.stopName,
    }));

  // ─── Build participants array from either array or comma-string ───────────
  const buildParticipantsArray = () => {
    if (Array.isArray(participants)) {
      return participants;
    }
    if (typeof participants === 'string' && participants.trim()) {
      return participants.split(',').map(p => p.trim());
    }
    return [];
  };

  // ✅ ─── ENHANCED: Ride creation with full validation ──────────────────────
  const handleCreateRide = async () => {
    // ────────────────────────────────────────────────────────────────────────────
    // STEP 1: INPUT VALIDATION
    // ────────────────────────────────────────────────────────────────────────────

    // ✅ Validate ride name
    const nameError = validateRideName(rideName);
    if (nameError) {
      setError(nameError);
      Alert.alert('Invalid Input', nameError);
      return;
    }

    // ✅ Validate ride date
    const dateError = validateRideDate(date);
    if (dateError) {
      setError(dateError);
      Alert.alert('Invalid Date', dateError);
      return;
    }

    // ✅ Validate starting & ending point names exist
    if (!startingPoint.trim()) {
      const msg = ERROR_MESSAGES.RIDE_CREATION.STARTING_POINT_REQUIRED;
      setError(msg);
      Alert.alert('Missing Location', msg);
      return;
    }

    if (!endingPoint.trim()) {
      const msg = ERROR_MESSAGES.RIDE_CREATION.ENDING_POINT_REQUIRED;
      setError(msg);
      Alert.alert('Missing Location', msg);
      return;
    }

    // ✅ Validate coordinates (critical safety check)
    const coordErrors = validateCoordinates(
      startingLatitude,
      startingLongitude,
      endingLatitude,
      endingLongitude,
    );
    if (coordErrors && coordErrors.length > 0) {
      const firstError = coordErrors[0].message;
      setError(firstError);
      Alert.alert('Invalid Coordinates', firstError);
      return;
    }

    // ────────────────────────────────────────────────────────────────────────────
    // STEP 2: PREPARE RIDE DATA
    // ────────────────────────────────────────────────────────────────────────────

    setLoading(true);
    setError('');

    // Safely parse coordinates (guaranteed to be valid from validation above)
    const startLatParsed = parseFloat(startingLatitude);
    const startLngParsed = parseFloat(startingLongitude);
    const endLatParsed = parseFloat(endingLatitude);
    const endLngParsed = parseFloat(endingLongitude);
    const locLatParsed = parseFloat(latitude);
    const locLngParsed = parseFloat(longitude);

    const rideData = {
      ridesName: rideName.trim(),
      locationName: locationName.trim(),
      riderType: riderType || 'CAR',
      date: date.toISOString(),
      description: description.trim(),
      latitude: locLatParsed || parseFloat(DEFAULT_LAT),
      longitude: locLngParsed || parseFloat(DEFAULT_LNG),
      startLat: startLatParsed,
      startLng: startLngParsed,
      endLat: endLatParsed,
      endLng: endLngParsed,
      startingPoint: startingPoint.trim(),
      endingPoint: endingPoint.trim(),
      stopPoints: buildStopPointsPayload(),
      participants: buildParticipantsArray(),
    };

    // ────────────────────────────────────────────────────────────────────────────
    // STEP 3: CREATE RIDE (API CALL)
    // ────────────────────────────────────────────────────────────────────────────

    try {
      console.log('🚀 Creating ride with data:', {
        name: rideData.ridesName,
        route: `${rideData.startingPoint} → ${rideData.endingPoint}`,
        coords: `[${rideData.startLat}, ${rideData.startLng}] → [${rideData.endLat}, ${rideData.endLng}]`,
        date: rideData.date,
      });

      const result = await createRide(rideData);


      // ────────────────────────────────────────────────────────────────────────
      // STEP 4: EXTRACT AND VALIDATE RIDE ID
      // ────────────────────────────────────────────────────────────────────────

      const generatedId =
        result?.generatedRidesId ??
        result?.ridesId ??
        result?.rideId ??
        result?.id ??
        result?.generatedId ??
        (typeof result === 'string' ? result : null);

      if (!generatedId) {
        const msg = ERROR_MESSAGES.RIDE_CREATION.RIDE_CREATION_NO_ID;
        console.error('⚠️ Ride created but no ID returned:', result);
        setError(msg);
        Alert.alert('Warning', msg, [
          {
            text: 'OK',
            onPress: () => {
              setLoading(false);
            },
          },
        ]);
        return;
      }

      // ────────────────────────────────────────────────────────────────────────
      // STEP 5: SUCCESS — STORE ID AND ADVANCE
      // ────────────────────────────────────────────────────────────────────────

      console.log('✨ Ride created successfully:', {
        rideId: generatedId,
        name: rideData.ridesName,
      });

      setGeneratedRidesId(generatedId);
      pendingRideIdRef.current = generatedId;

      const successMsg = SUCCESS_MESSAGES.RIDE_OPERATIONS.RIDE_CREATED;
      Alert.alert('Success', successMsg, [
        {
          text: 'View Ride',
          onPress: () => {
            setCurrentStep(4);
          },
        },
      ]);
    } catch (err) {
      // ────────────────────────────────────────────────────────────────────────
      // STEP 6: ERROR HANDLING
      // ────────────────────────────────────────────────────────────────────────

      console.error('❌ Ride creation failed:', err);

      const errorMsg = resolveErrorMessage(
        err,
        ERROR_MESSAGES.RIDE_CREATION.RIDE_CREATION_FAILED,
      );

      setError(errorMsg);

      Alert.alert('Ride Creation Failed', errorMsg, [
        {
          text: 'Try Again',
          onPress: () => {
            setError('');
          },
        },
        {
          text: 'Cancel',
          onPress: () => {
            setError('');
          },
          style: 'cancel',
        },
      ]);
    } finally {
      // ────────────────────────────────────────────────────────────────────────
      // CLEANUP
      // ────────────────────────────────────────────────────────────────────────

      setLoading(false);
    }
  };

  return {
    webViewRef,
    pendingRideIdRef,
    loading,
    error,
    currentStep,
    nextStep,
    prevStep,
    rideName,
    setRideName,
    riderType,
    setRiderType,
    date,
    setDate,
    participants,
    setParticipants,
    description,
    setDescription,
    locationName,
    setLocationName,
    latitude,
    longitude,
    locationSelected,
    rideNameImage,
    startingPoint,
    setStartingPoint,
    startingLatitude,
    startingLongitude,
    endingPoint,
    setEndingPoint,
    endingLatitude,
    endingLongitude,
    stopPoints,
    setStopPoints,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    handleSearchInputChange,
    handleLocationSelect,
    mapMode,
    setMapMode,
    handleMessage,
    generatedRidesId,
    handleCreateRide,
  };
};

export default useCreateRide;
