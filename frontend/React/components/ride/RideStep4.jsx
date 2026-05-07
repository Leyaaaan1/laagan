import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {rideAction} from '../../services/rideAction';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  fetchRideMapImage,
  getRideDetails,
  getLocationImage,
} from '../../services/rideService';
import ParticipantList from './modal/ParticipantList';
import {startService} from '../../services/startService';
import RouteMapView from '../../utilities/route/view/RouteMapView';
import {
  isValidCoordinate,
  processRideCoordinates,
} from '../../utilities/CoordinateUtils';
import cards from '../../styles/base/cards';
import buttons from '../../styles/base/buttons';
import header from '../../styles/base/header';
import badges from '../../styles/base/badges';
import rideStep4Styles from '../../styles/screens/rideStep4';
import mapStyles from '../../styles/components/mapStyles';
import {
  formatDate,
  getLocationDisplayName,
  getRideTypeIcon,
} from './utilities/RideStepUtils';
import useJoinRide from './utilities/RideHandler';
import {useAuth} from '../../context/AuthContext';
const RideActionButton = ({
  isOwner,
  onJoin,
  onStart,
  hasJoined,
  hasPendingRequest,
  rideStarted,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <View style={[rideStep4Styles.joinButton, {opacity: 0.6}]}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  // ── Owner branch ──────────────────────────────────────────────────────────
  if (isOwner) {
    if (rideStarted) {
      return (
        <TouchableOpacity
          style={[rideStep4Styles.startButton, {opacity: 0.5}]}
          disabled={true}
          onPress={() => Alert.alert('Info', 'Ride already started')}>
          <FontAwesome name="check" size={16} color="#fff" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={rideStep4Styles.startButton} onPress={onStart}>
        <FontAwesome name="play" size={16} color="#fff" />
      </TouchableOpacity>
    );
  }

  // ── Participant branch ────────────────────────────────────────────────────
  if (hasJoined) {
    return (
      <TouchableOpacity
        style={[rideStep4Styles.joinButton, {opacity: 0.5}]}
        disabled={true}
        onPress={() => Alert.alert('Info', 'You already joined this ride')}>
        <FontAwesome
          name="check-circle"
          size={14}
          color="#fff"
          style={{marginRight: 6}}
        />
        <Text style={rideStep4Styles.joinButtonText}>Joined</Text>
      </TouchableOpacity>
    );
  }

  if (hasPendingRequest) {
    return (
      <TouchableOpacity
        style={[
          rideStep4Styles.joinButton,
          {opacity: 0.6, backgroundColor: '#ffa500'},
        ]}
        disabled={true}
        onPress={() => Alert.alert('Info', 'Join request pending')}>
        <FontAwesome
          name="hourglass-half"
          size={14}
          color="#fff"
          style={{marginRight: 6}}
        />
        <Text style={rideStep4Styles.joinButtonText}>Pending</Text>
      </TouchableOpacity>
    );
  }

  // ── Default: can join ─────────────────────────────────────────────────────
  return (
    <TouchableOpacity style={rideStep4Styles.joinButton} onPress={onJoin}>
      <FontAwesome
        name="plus"
        size={14}
        color="#fff"
        style={{marginRight: 6}}
      />
      <Text style={rideStep4Styles.joinButtonText}>Join</Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RideHeroCard
// ─────────────────────────────────────────────────────────────────────────────
const RideHeroCard = ({
  rideName,
  date,
  username,
  riderType,
  distance,
  description,
  rideDetailsWithCoords,
  startingPointName,
  endingPointName,
}) => (
  <View style={cards.hero}>
    <View style={cards.heroHeader}>
      <View style={{flex: 1}}>
        <Text style={cards.heroTitle}>{rideName}</Text>
        <Text style={cards.infoValue} numberOfLines={2}>
          {formatDate(date)}
        </Text>
        <View style={cards.heroMeta}>
          <FontAwesome name="user-circle" size={14} color="#8c2323" />
          <Text style={cards.heroMetaText}>
            {(username || '').toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={badges.rideType}>
        <FontAwesome name={getRideTypeIcon(riderType)} size={20} color="#fff" />
        <Text style={cards.infoValue}>{distance} km</Text>
      </View>
    </View>

    {description && (
      <View style={cards.description}>
        <Text style={[mapStyles.routePointLabel, {marginLeft: 8}]}>
          Details
        </Text>
        <ScrollView
          scrollEnabled={true}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          style={{flex: 1}}>
          <Text style={cards.descriptionText}>{description}</Text>
        </ScrollView>
      </View>
    )}

    <View
      style={{
        flexDirection: 'column',
        width: '100%',
        alignItems: 'flex-start',
      }}>
      <View style={[cards.info, {width: '100%', marginBottom: 8}]}>
        <Text
          style={[mapStyles.routePointLabel, {marginLeft: 8, marginBottom: 6}]}>
          From
        </Text>
        <Text style={mapStyles.routePointText}>
          {getLocationDisplayName(
            rideDetailsWithCoords?.startingPointName || startingPointName,
          )}
        </Text>
      </View>
      <View style={[cards.info, {width: '100%'}]}>
        <Text
          style={[mapStyles.routePointLabel, {marginLeft: 8, marginBottom: 6}]}>
          To
        </Text>
        <Text style={mapStyles.routePointText}>
          {getLocationDisplayName(
            rideDetailsWithCoords?.endingPointName || endingPointName,
          )}
        </Text>
      </View>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// RideStep4
// ─────────────────────────────────────────────────────────────────────────────
const RideStep4 = props => {
  const navigation = useNavigation();
  const {username: authUsername} = useAuth();

  const routeParams = props.route?.params || {};
  const merged = {...routeParams, ...props};
  const {
    generatedRidesId,
    rideName,
    locationName,
    riderType,
    date,
    startingPoint,
    endingPoint,
    startingPointName,
    endingPointName,
    participants,
    description,
    distance,
    username,
    stopPoints,
    currentUsername,
    active: isRideStarted = true,
    rideDetailsWithCoords: passedRideDetails = null,
    skipCoordsFetch = false,
  } = merged;

  console.log('sam[ple', stopPoints);
  console.log('all data', merged);
  console.log('params', routeParams);

  const startLat =
    merged.startLat ??
    merged.startingPoint?.lat ??
    merged.startingPoint?.latitude;
  const startLng =
    merged.startLng ??
    merged.startingPoint?.lng ??
    merged.startingPoint?.longitude;
  const endLat =
    merged.endLat ?? merged.endingPoint?.lat ?? merged.endingPoint?.latitude;
  const endLng =
    merged.endLng ?? merged.endingPoint?.lng ?? merged.endingPoint?.longitude;


  // Prefer the currentUsername passed via params (set by buildRideStep4Params),
  // fall back to the auth context username.
  const resolvedCurrentUsername = currentUsername || authUsername;

  const hasFetchedRef = useRef(skipCoordsFetch && !!passedRideDetails);
  const {joinRide} = useJoinRide();

  // ── Action status ─────────────────────────────────────────────────────────
  // Start as "loading" so the button shows a spinner instead of "Join"
  // while the API call is in flight. This prevents the owner seeing "Join".
  const [actionStatusLoading, setActionStatusLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({
    isOwner: false,
    hasJoined: false,
    hasPendingRequest: false,
    rideStarted: false,
    isActive: false,
  });

  // ── UI state ──────────────────────────────────────────────────────────────
  const [state, setState] = useState({
    mapImage: null,
    startMapImage: passedRideDetails?.magImageStartingLocation || null,
    endMapImage: passedRideDetails?.magImageEndingLocation || null,
    rideNameImage: null,
    imageLoading: false,
    rideNameImageLoading: false,
    rideNameImageError: null,
    distanceState: passedRideDetails?.distance ?? distance ?? '--',
    showParticipantsModal: false,
    rideDetailsWithCoords: passedRideDetails || null,
  });

  const patchState = patch => setState(prev => ({...prev, ...patch}));

  // ── fetchActionStatus — defined with useCallback so it is stable ──────────
  // The backend derives the username from the JWT in the Authorization header,
  // so we do NOT need to send the username from the frontend.
  const fetchActionStatus = useCallback(async () => {
    if (!generatedRidesId) return;
    setActionStatusLoading(true);
    try {
      const status = await rideAction.getRideActionStatus(generatedRidesId);
      console.log('Action status response:', status);

      setActionStatus({
        isOwner: status?.isOwner ?? false,
        hasJoined: status?.hasJoined ?? false,
        hasPendingRequest: status?.hasPendingRequest ?? false,
        rideStarted: status?.rideStarted ?? false,
        isActive: status?.isActive ?? false,
      });
    } catch (error) {
      console.warn('Failed to fetch action status:', error);
    } finally {
      setActionStatusLoading(false);
    }
  }, [generatedRidesId]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleJoinRide = () => {
    // Safety guard: owner should never reach this, but just in case
    if (actionStatus.isOwner) {
      Alert.alert('Info', 'You are the owner of this ride.');
      return;
    }
    if (!generatedRidesId) {
      Alert.alert('Error', 'Missing ride information. Please try again.');
      return;
    }
    joinRide(generatedRidesId, null, () => {
      fetchActionStatus();
    });
  };

  const handleSwipeToMap = () => {
    const rideDetails = state.rideDetailsWithCoords;
    navigation.navigate('StartedRide', {
      activeRide: {
        generatedRidesId,
        id: generatedRidesId,
        rideName,
        locationName,
        riderType,
        date,
        description,
        distance: state.distanceState || distance,
        username,
        startedBy: resolvedCurrentUsername,
        startingPointName: rideDetails?.startingPointName || startingPoint,
        endingPointName: rideDetails?.endingPointName || endingPoint,
        startingPoint: mapCoords.startingPoint,
        endingPoint: mapCoords.endingPoint,
        stopPoints: mapCoords.stopPoints || [],
        participants: participants || [],
        mapImage: state.mapImage || null,
        startMapImage: state.startMapImage || null,
        endMapImage: state.endMapImage || null,
        rideNameImage: state.rideNameImage || [],
        isActive: true,
      },
      username: resolvedCurrentUsername,
    });
  };

  const handleStartRide = async () => {
    try {
      await startService.startRide(generatedRidesId);
      fetchActionStatus();
      navigation.navigate('StartedRide', {
        activeRide: {
          generatedRidesId,
          id: generatedRidesId,
          rideName,
          locationName,
          riderType,
          date,
          description,
          distance: state.distanceState || distance,
          username,
          startedBy: resolvedCurrentUsername,
          startingPoint: mapCoords.startingPoint,
          endingPoint: mapCoords.endingPoint,
          stopPoints: mapCoords.stopPoints,
          startingPointName:
            mapCoords.startingPoint?.name ||
            getLocationDisplayName(startingPoint),
          endingPointName:
            mapCoords.endingPoint?.name || getLocationDisplayName(endingPoint),
          participants: participants || [],
          mapImage: state.mapImage || null,
          startMapImage: state.startMapImage || null,
          endMapImage: state.endMapImage || null,
          rideNameImage: state.rideNameImage || [],
        },
        username: resolvedCurrentUsername,
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start the ride.');
    }
  };

  // ── Coordinate processing ─────────────────────────────────────────────────
  const mapCoords = useMemo(() => {
    if (state.rideDetailsWithCoords) {
      return processRideCoordinates(state.rideDetailsWithCoords);
    }

    const resolvedStart = isValidCoordinate({lat: startLat, lng: startLng})
      ? {
          name:
            typeof startingPoint === 'string'
              ? startingPoint
              : startingPoint?.name || startingPointName || 'Starting Point',
          lat: parseFloat(startLat),
          lng: parseFloat(startLng),
        }
      : null;

    const resolvedEnd = isValidCoordinate({lat: endLat, lng: endLng})
      ? {
          name:
            typeof endingPoint === 'string'
              ? endingPoint
              : endingPoint?.name || endingPointName || 'Ending Point',
          lat: parseFloat(endLat),
          lng: parseFloat(endLng),
        }
      : null;

    return {
      startingPoint: resolvedStart,
      endingPoint: resolvedEnd,
      stopPoints: Array.isArray(stopPoints) ? stopPoints : [],
    };
  }, [
    state.rideDetailsWithCoords,
    startLat,
    startLng,
    endLat,
    endLng,
    startingPoint,
    startingPointName,
    endingPoint,
    endingPointName,
    stopPoints,
  ]);

  const hasValidRouteData =
    isValidCoordinate(mapCoords.startingPoint) ||
    isValidCoordinate(mapCoords.endingPoint) ||
    !!state.rideDetailsWithCoords;

  // ── Effects ───────────────────────────────────────────────────────────────

  // Fetch action status when the ride ID is available
  useEffect(() => {
    fetchActionStatus();
  }, [fetchActionStatus]);

  // Fetch location image
  useEffect(() => {
    if (!locationName) return;
    patchState({rideNameImageLoading: true, rideNameImageError: null});
    getLocationImage(locationName)
      .then(imgs =>
        patchState({rideNameImage: Array.isArray(imgs) ? imgs : []}),
      )
      .catch(err =>
        patchState({
          rideNameImageError: err.message || 'Failed to load location images',
        }),
      )
      .finally(() => patchState({rideNameImageLoading: false}));
  }, [locationName]);

  // Fetch map image
  useEffect(() => {
    if (!generatedRidesId) return;
    patchState({imageLoading: true});
    fetchRideMapImage(generatedRidesId)
      .then(url => patchState({mapImage: url}))
      .catch(err => console.error('Map image fetch error:', err?.message))
      .finally(() => patchState({imageLoading: false}));
  }, [generatedRidesId]);

  // Fetch ride details with coordinates
  useEffect(() => {
    if (!generatedRidesId || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    patchState({imageLoading: true});
    getRideDetails(generatedRidesId)
      .then(details => {
        setState(prev => ({
          ...prev,
          mapImage: details.mapImageUrl || prev.mapImage,
          startMapImage: details.magImageStartingLocation || prev.startMapImage,
          endMapImage: details.magImageEndingLocation || prev.endMapImage,
          distanceState: details.distance || prev.distanceState,
          rideDetailsWithCoords: details,
          imageLoading: false,
        }));
      })
      .catch(err => {
        console.warn('Ride details fetch error:', err.message);
        patchState({imageLoading: false});
      });
  }, [generatedRidesId]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={rideStep4Styles.container}>
      <StatusBar
        backgroundColor="#000"
        barStyle="light-content"
        translucent={false}
      />

      <View style={header.bar}>
        <TouchableOpacity
          style={header.backButton}
          onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={header.center}>
          <Text style={header.title} numberOfLines={1}>
            {locationName}
          </Text>
          <Text style={header.subtitle}>ID: {generatedRidesId}</Text>
        </View>
        <View style={header.right}>
          <RideActionButton
            isOwner={actionStatus.isOwner}
            onJoin={handleJoinRide}
            onStart={handleStartRide}
            hasJoined={actionStatus.hasJoined}
            hasPendingRequest={actionStatus.hasPendingRequest}
            rideStarted={actionStatus.rideStarted}
            isLoading={actionStatusLoading}
          />
        </View>
      </View>

      <View style={rideStep4Styles.fadeContainer}>
        <View style={mapStyles.wrapper}>
          {!hasValidRouteData && (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f5f5f5',
              }}>
              <Text
                style={{
                  color: '#666',
                  fontSize: 14,
                  textAlign: 'center',
                  paddingHorizontal: 20,
                }}>
                Route coordinates unavailable
              </Text>
            </View>
          )}
          {hasValidRouteData && (
            <RouteMapView
              generatedRidesId={generatedRidesId}
              startingPoint={mapCoords.startingPoint}
              endingPoint={mapCoords.endingPoint}
              stopPoints={mapCoords.stopPoints}
              style={{flex: 1}}
              isDark={true}
            />
          )}
        </View>

        <ScrollView
          style={rideStep4Styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <RideHeroCard
            rideName={rideName}
            date={date}
            username={username}
            riderType={riderType}
            distance={distance}
            description={description}
            rideDetailsWithCoords={state.rideDetailsWithCoords}
            startingPointName={startingPointName}
            endingPointName={endingPointName}
          />

          <View style={header.bottomNav}>
            <TouchableOpacity
              style={buttons.bottomNav}
              onPress={() => patchState({showParticipantsModal: true})}>
              <FontAwesome name="users" size={18} color="#fff" />
              <Text style={buttons.textNav}>Riders</Text>
            </TouchableOpacity>

            <View style={header.bottomNavDivider} />

            {isRideStarted && (
              <>
                <View style={header.bottomNavDivider} />
                <TouchableOpacity
                  style={[
                    buttons.bottomNav,
                    {backgroundColor: 'rgba(140, 35, 35, 0.15)'},
                  ]}
                  onPress={handleSwipeToMap}>
                  <FontAwesome name="map" size={18} color="#8c2323" />
                  <Text style={[buttons.textNav, {color: '#8c2323'}]}>
                    Map View
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={buttons.bottomNav}
              onPress={() =>
                navigation.navigate('RideRoutesPage', {
                  startingPoint: getLocationDisplayName(startingPoint),
                  endingPoint: getLocationDisplayName(endingPoint),
                  generatedRidesId,
                  stopPoints,
                })
              }>
              <FontAwesome name="map-marker" size={18} color="#fff" />
              <Text style={buttons.textNav}>Stop Point</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <ParticipantList
        visible={state.showParticipantsModal}
        onClose={() => patchState({showParticipantsModal: false})}
        participants={participants}
        generatedRidesId={generatedRidesId}
        username={username}
        currentUsername={resolvedCurrentUsername}
      />
    </View>
  );
};

export default RideStep4;
