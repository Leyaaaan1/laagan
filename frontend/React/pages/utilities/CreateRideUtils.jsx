import {useState, useEffect, useRef, useCallback} from 'react';
import {Alert} from 'react-native';
import {
  searchLocation,
  searchCityOrLandmark,
  createRide,
  getLocationImage,
  getAllRiderTypes,
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
import {DEFAULT_COORDS} from '../../utilities/route/map/appDefaults';
import {useUserLocation} from '../../hooks/useUserLocation';
import {handleWebViewMessage} from '../../utilities/mapUtils';
import {routeCache} from '../../services/cache/routeCache';

// ─── Default coordinates (Davao City) ────────────────────────────────────────
const DEFAULT_LAT = '7.0731';
const DEFAULT_LNG = '125.6128';

const useCreateRide = ({}) => {
  const webViewRef = useRef(null);
  const pendingRideIdRef = useRef(null);

  const {location, loading: locationLoading} = useUserLocation();


  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // ── Ride details (Step 1) ─────────────────────────────────────────────────
  const [rideName, setRideName] = useState('');
  const [riderType, setRiderType] = useState('ADV 160');
  const [date, setDate] = useState(new Date());
  const [participants, setParticipants] = useState('');
  const [description, setDescription] = useState('');

  const isStartingPointFromSearchRef = useRef(false);
  const isEndingPointFromSearchRef = useRef(false);
  const setStartingPointFromSearch = val => {
    isStartingPointFromSearchRef.current = val;
  };
  const setEndingPointFromSearch = val => {
    isEndingPointFromSearchRef.current = val;
  };

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
  // Keep a ref so callbacks (handleMessage, handleLocationSelect) always read
  // the *current* mapMode without needing it in their dependency arrays.
  const mapModeRef = useRef('starting');
  const _setMapMode = useCallback(val => {
    mapModeRef.current = val;
    setMapMode(val);
  }, []);

  const [riderTypeOptions, setRiderTypeOptions] = useState([]);
  const [riderTypeLoading, setRiderTypeLoading] = useState(false);

  // ── Step-based map mode sync ──────────────────────────────────────────────
  useEffect(() => {
    if (currentStep === 2) {
      _setMapMode('location');
    } else if (currentStep === 3) {
      _setMapMode('starting');
    }
  }, [currentStep]);

  // ── Generated ride (Step 4) ───────────────────────────────────────────────
  const [generatedRidesId, setGeneratedRidesId] = useState(null);

  // ─── Step navigation ──────────────────────────────────────────────────────
  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // ─── Map tap / drag ───────────────────────────────────────────────────────

  const handleMessage = useCallback(
    event =>
      handleWebViewMessage(event, {
        mapMode: mapModeRef.current, // always current — no stale closure
        setLatitude,
        setLongitude,
        setStartingLatitude,
        setStartingLongitude,
        setStartingPointFromSearch,
        setEndingLatitude,
        setEndingLongitude,
        setEndingPointFromSearch,
        setLocationName,
        setLocationSelected,
        setStartingPoint,
        setEndingPoint,
      }),
    // No mapMode in deps — ref keeps it fresh
    [],
  );
  const handleSearchInputChange = useCallback(value => {
    // Only reset locationSelected when the user is actively typing new text,
    // NOT on every call (e.g. clearing the query string sets it to '' which
    // should not wipe out a previously confirmed search selection).
    if (value) {
      setLocationSelected(false);
    }
    setSearchQuery(value);
  }, []);

  useEffect(() => {
    const fetchRiderTypes = async () => {
      setRiderTypeLoading(true);
      try {
        const types = await getAllRiderTypes();
        setRiderTypeOptions(types);
        if (types.length > 0) {
          setRiderType(types[0].riderType);
        }
      } catch (error) {
        setRiderType('ADV 160');
      } finally {
        setRiderTypeLoading(false);
      }
    };

    fetchRiderTypes();
  }, []);

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
      searchFn(searchQuery)
        .then(data => setSearchResults(data))
        .catch(() =>
          Alert.alert('Error', ERROR_MESSAGES.LOCATION.SEARCH_FAILED),
        )
        .finally(() => setIsSearching(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, locationSelected, mapMode]);

  // ─── Location selection (from search result) ──────────────────────────────

  const handleLocationSelect = useCallback(
    async location => {
      const lat = parseFloat(location.lat);
      const lon = parseFloat(location.lon);
      setLocationSelected(true);

      const selectedName = location.display_name
        ? location.display_name.split(',')[0].trim()
        : `${lat}, ${lon}`;

      // Read from ref — always the current mode, never stale
      const currentMode = mapModeRef.current;

      if (currentMode === 'location') {
        setLatitude(lat.toString());
        setLongitude(lon.toString());
        setLocationName(selectedName);
        getLocationImage(selectedName)
          .then(imgs => setRideNameImage(imgs))
          .catch(() => setRideNameImage([]));
      } else if (currentMode === 'starting') {
        setStartingLatitude(lat.toString());
        setStartingLongitude(lon.toString());
        setStartingPoint(selectedName);
        setStartingPointFromSearch(true);
        _setMapMode('ending');
      } else if (currentMode === 'ending') {
        setEndingLatitude(lat.toString());
        setEndingLongitude(lon.toString());
        setEndingPoint(selectedName);
        setEndingPointFromSearch(true);
      }

      setSearchQuery(selectedName);
      setSearchResults([]);

      return selectedName;
    },
    // No mapMode in deps — ref keeps it fresh
    [],
  );
  // ─── Build stop-points payload for the API ────────────────────────────────
  const buildStopPointsPayload = () =>
    stopPoints.map(sp => ({
      stopLatitude: sp.lat ?? sp.stopLatitude,
      stopLongitude: sp.lng ?? sp.stopLongitude,
      stopName: sp.name ?? sp.stopName,
    }));

  const buildStopPointsFromSearchArray = () =>
    stopPoints.map(sp => sp.isFromSearch ?? false);

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

  const handleCreateRide = useCallback(async () => {
    // ────────────────────────────────────────────────────────────────────────────
    // STEP 1: INPUT VALIDATION
    // ────────────────────────────────────────────────────────────────────────────


    const nameError = validateRideName(rideName);
    if (nameError) {
      setError(nameError);
      Alert.alert('Invalid Input', nameError);
      return;
    }

    const dateError = validateRideDate(date);
    if (dateError) {
      setError(dateError);
      Alert.alert('Invalid Date', dateError);
      return;
    }

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
    await createRide;

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

    const mapRiderTypeToDatabase = type => {
      const typeMap = {
        CAR: 'ADV 160',
        MOTORCYCLE: 'ADV 160',
        BIKE: 'ADV 160',
        SCOOTER: 'PCX 160',
        default: 'ADV 160',
      };
      return typeMap[type] || typeMap['default'];
    };

    const rideData = {
      ridesName: rideName.trim(),
      locationName: locationName.trim(),
      isLocationFromSearch: locationSelected,
      riderType: mapRiderTypeToDatabase(riderType),
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
      startingPointName: startingPoint.trim(), //
      endingPointName: endingPoint.trim(), //
      isStartingPointFromSearch: isStartingPointFromSearchRef.current, //  always current
      isEndingPointFromSearch: isEndingPointFromSearchRef.current, //  always current
      stopPoints: buildStopPointsPayload(),
      stopPointsFromSearch: buildStopPointsFromSearchArray(),
      participants: buildParticipantsArray(),
    }; // ────────────────────────────────────────────────────────────────────────────
    // STEP 3: CREATE RIDE (API CALL)
    // ────────────────────────────────────────────────────────────────────────────

    try {

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
      // STEP 5: CACHE THE ROUTE COORDINATES (NEW!)
      // ────────────────────────────────────────────────────────────────────────

      const routeCoordinates = {
        startLat: startLatParsed,
        startLng: startLngParsed,
        endLat: endLatParsed,
        endLng: endLngParsed,
        stopPoints: buildStopPointsPayload(),
        startingPointName: startingPoint,
        endingPointName: endingPoint,
      };

      await routeCache.save(generatedId, routeCoordinates).catch(e => {
      });

      setGeneratedRidesId(generatedId);
      pendingRideIdRef.current = generatedId;

      setCurrentStep(4);
    } catch (err) {
      // ────────────────────────────────────────────────────────────────────────
      // STEP 7: ERROR HANDLING
      // ────────────────────────────────────────────────────────────────────────


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
      setLoading(false);
    }
  }, [
    rideName,
    date,
    startingPoint,
    endingPoint,
    startingLatitude,
    startingLongitude,
    endingLatitude,
    endingLongitude,
    locationName,
    locationSelected,
    description,
    latitude,
    longitude,
    riderType,
    participants,
    stopPoints,
  ]);

  return {
    webViewRef,
    pendingRideIdRef,
    locationLoading,
    loading,
    error,
    currentStep,
    nextStep, //
    prevStep, //
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
    setEndingLatitude,
    setEndingLongitude,
    stopPoints,
    setStopPoints,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    setStartingPointFromSearch, //
    setEndingPointFromSearch,
    handleSearchInputChange, //
    handleLocationSelect, //
    mapMode,
    setMapMode: _setMapMode, // children must use this so the ref stays in sync
    handleMessage, //
    generatedRidesId,
    handleCreateRide, //
  };
};

export default useCreateRide;
