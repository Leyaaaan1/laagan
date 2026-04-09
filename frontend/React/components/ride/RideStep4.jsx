import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StatusBar, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { fetchRideMapImage, getRideDetails, getLocationImage } from '../../services/rideService';
import ParticipantList from './modal/ParticipantList';
import { startService } from '../../services/startService';
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
import {formatDate, getLocationDisplayName, getRideTypeIcon} from './utilities/RideStepUtils';
import useJoinRide from './utilities/RideHandler';


const RideActionButton = ({ isOwner, onJoin, onStart }) =>
  isOwner ? (
    <TouchableOpacity style={rideStep4Styles.startButton} onPress={onStart}>
      <FontAwesome name="play" size={16} color="#fff" />
    </TouchableOpacity>
  ) : (
    <TouchableOpacity style={rideStep4Styles.joinButton} onPress={onJoin}>
      <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 6 }} />
      <Text style={rideStep4Styles.joinButtonText}>Join</Text>
    </TouchableOpacity>
  );

const RideHeroCard = ({ rideName, date, username, riderType, distance, description, startingPoint, endingPoint, rideDetailsWithCoords }) => (
  <View style={cards.hero}>
    <View style={cards.heroHeader}>
      <View style={{ flex: 1 }}>
        <Text style={cards.heroTitle}>{rideName}</Text>
        <Text style={cards.infoValue} numberOfLines={2}>{formatDate(date)}</Text>
        <View style={cards.heroMeta}>
          <FontAwesome name="user-circle" size={14} color="#8c2323" />
          <Text style={cards.heroMetaText}>{(username || '').toUpperCase()}</Text>
        </View>
      </View>
      <View style={badges.rideType}>
        <FontAwesome name={getRideTypeIcon(riderType)} size={20} color="#fff" />
        <Text style={cards.infoValue}>{distance} km</Text>
      </View>
    </View>

    {description && (
      <View style={cards.description}>
        <Text style={[mapStyles.routePointLabel, { marginLeft: 8 }]}>Description</Text>
        <Text style={cards.descriptionText}>{description}</Text>
      </View>
    )}

    {/* From / To */}
    <View style={{ flexDirection: 'column', width: '100%', alignItems: 'flex-start' }}>
      <View style={[cards.info, { width: '100%', marginBottom: 8 }]}>
        <Text style={[mapStyles.routePointLabel, { marginLeft: 8, marginBottom: 6 }]}>From</Text>
        <Text style={mapStyles.routePointText}>
          {getLocationDisplayName(rideDetailsWithCoords?.startingPointName)}
        </Text>
      </View>
      <View style={[cards.info, { width: '100%' }]}>
        <Text style={[mapStyles.routePointLabel, { marginLeft: 8, marginBottom: 6 }]}>To</Text>
        <Text style={mapStyles.routePointText}>
          {getLocationDisplayName(rideDetailsWithCoords?.endingPointName)}
        </Text>
      </View>
    </View>
  </View>
);


const RideStep4 = (props) => {
  const navigation = useNavigation();

  // Supports both direct props (from CreateRide) and navigation route params
  const routeParams = props.route?.params || {};
  const merged = { ...routeParams, ...props };

  const {
    generatedRidesId, rideName, locationName, riderType, date,
    startingPoint, endingPoint, participants, description,
    token, distance, username, stopPoints, currentUsername,
    active: isRideStarted = true,
    rideDetailsWithCoords: passedRideDetails = null,
    skipCoordsFetch = false,
  } = merged;

  const hasFetchedRef = useRef(skipCoordsFetch && !!passedRideDetails);
  const { joinRide }  = useJoinRide();

  const [state, setState] = useState({
    mapImage:             null,
    startMapImage:        passedRideDetails?.magImageStartingLocation || null,
    endMapImage:          passedRideDetails?.magImageEndingLocation   || null,
    rideNameImage:        null,
    imageLoading:         false,
    rideNameImageLoading: false,
    rideNameImageError:   null,
    distanceState:        passedRideDetails?.distance ?? distance ?? '--',
    showParticipantsModal: false,
    rideDetailsWithCoords: passedRideDetails || null,
  });


  // Convenience updater — merge a partial state object
  const patchState = (patch) => setState(prev => ({ ...prev, ...patch }));

  // ── Build map coords (immediate fallback while API loads) ─────────────────
  const rawFallbackCoords = {
    startingPoint: startingPoint
      ? typeof startingPoint === 'string'
        ? isValidCoordinate(merged.startLat, merged.startLng)
          ? {
              name: startingPoint,
              lat: parseFloat(merged.startLat),
              lng: parseFloat(merged.startLng),
            }
          : null // ✅ NEW: Return null instead of {lat: 0, lng: 0}
        : startingPoint
      : null,
    endingPoint: endingPoint
      ? typeof endingPoint === 'string'
        ? isValidCoordinate(merged.endLat, merged.endLng)
          ? {
              name: endingPoint,
              lat: parseFloat(merged.endLat),
              lng: parseFloat(merged.endLng),
            }
          : null // ✅ NEW: Return null instead of {lat: 0, lng: 0}
        : endingPoint
      : null,
    stopPoints: Array.isArray(stopPoints) ? stopPoints : [],
  };
  const mapCoords = useMemo(
    () =>
      processRideCoordinates(state.rideDetailsWithCoords) || rawFallbackCoords,
    [state.rideDetailsWithCoords, rawFallbackCoords],
  );

  // ✅ NEW: Check if route data is unavailable
  const hasValidRouteData =
    (mapCoords.startingPoint &&
      mapCoords.startingPoint.lat &&
      mapCoords.startingPoint.lng) ||
    (mapCoords.endingPoint &&
      mapCoords.endingPoint.lat &&
      mapCoords.endingPoint.lng) ||
    state.rideDetailsWithCoords;

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleJoinRide = () => {
    if (!generatedRidesId || !token) {
      Alert.alert('Error', 'Missing ride information. Please try again.');
      return;
    }
    joinRide(generatedRidesId, token, () => console.log('Successfully requested to join ride'));
  };

  const handleSwipeToMap = () => {
    const rideDetails = state.rideDetailsWithCoords;
    navigation.navigate('StartedRide', {
      activeRide: {
        generatedRidesId, id: generatedRidesId, rideName, locationName,
        riderType, date, description,
        distance: state.distanceState || distance,
        username, startedBy: currentUsername,
        startingPoint: rideDetails?.startingPoint || startingPoint,
        endingPoint:   rideDetails?.endingPoint   || endingPoint,
        stopPoints:    rideDetails?.stopPoints    || stopPoints || [],
        participants:  participants || [],
        isActive: true,
      },
      token,
      username: currentUsername,
      fromRideStep4: true,
    });
  };


  const handleStartRide = async () => {
    try {
      await startService.startRide(generatedRidesId, token);
      navigation.navigate('StartedRide', {
        activeRide: {
          generatedRidesId, id: generatedRidesId, rideName, locationName,
          riderType, date, description,
          distance: state.distanceState || distance,
          username, startedBy: currentUsername,
          startingPoint: mapCoords.startingPoint,
          endingPoint:   mapCoords.endingPoint,
          stopPoints:    mapCoords.stopPoints,
          startingPointName: mapCoords.startingPoint?.name || getLocationDisplayName(startingPoint),
          endingPointName:   mapCoords.endingPoint?.name   || getLocationDisplayName(endingPoint),
          participants:  participants || [],
          mapImage:      state.mapImage        || null,
          startMapImage: state.startMapImage   || null,
          endMapImage:   state.endMapImage     || null,
          rideNameImage: state.rideNameImage   || [],
          imageLoading:  state.imageLoading    || false,
        },
        token,
        username: currentUsername,
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start the ride.');
    }
  };

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!locationName || !token) { return; }
    patchState({ rideNameImageLoading: true, rideNameImageError: null });
    getLocationImage(locationName, token)
      .then(imgs => patchState({ rideNameImage: Array.isArray(imgs) ? imgs : [] }))
      .catch(err  => patchState({ rideNameImageError: err.message || 'Failed to load location images' }))
      .finally(() => patchState({ rideNameImageLoading: false }));
  }, [locationName, token]);

  useEffect(() => {
    if (!generatedRidesId) {
      return;
    }
    patchState({imageLoading: true});
    fetchRideMapImage(generatedRidesId, token)
      .then(url => patchState({mapImage: url}))
      .catch(err =>
        console.error(
          'Map image fetch error:',
          err?.response?.status || err.message,
        ),
      )
      .finally(() => patchState({imageLoading: false}));
  }, [generatedRidesId, token]);

  useEffect(() => {
    if (!generatedRidesId || !token || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    patchState({imageLoading: true});

    getRideDetails(generatedRidesId, token)
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
  }, [generatedRidesId, token]);

  return (
    <View style={rideStep4Styles.container}>
      <StatusBar
        backgroundColor="#000"
        barStyle="light-content"
        translucent={false}
      />

      {/* ── Header ── */}
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
            isOwner={username === currentUsername}
            onJoin={handleJoinRide}
            onStart={handleStartRide}
          />
        </View>
      </View>

      <View style={rideStep4Styles.fadeContainer}>
        {/* ── Map ── */}
        <View style={mapStyles.wrapper}>
          {/* ✅ NEW: Show error message if coordinates are unavailable */}
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
              token={token}
              startingPoint={getLocationDisplayName(startingPoint)}
              endingPoint={getLocationDisplayName(endingPoint)}
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
          />

          {/* ── Bottom nav ── */}
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
                  startMapImage: state.startMapImage,
                  endMapImage: state.endMapImage,
                  mapImage: state.mapImage,
                  rideNameImage: state.rideNameImage,
                  startingPoint: getLocationDisplayName(startingPoint),  // ✅ FIXED
                  endingPoint: getLocationDisplayName(endingPoint),      // ✅ FIXED
                  rideName,
                  locationName,
                  riderType,
                  date,
                  participants,
                  description,
                  token,
                  distance,
                  username,
                  currentUsername,
                  generatedRidesId,
                })
              }
            >
              <FontAwesome name="map-marker" size={18} color="#fff" />
              <Text style={buttons.textNav}>Stop Point</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* ── Modals ── */}
      <ParticipantList
        visible={state.showParticipantsModal}
        onClose={() => patchState({showParticipantsModal: false})}
        participants={participants}
        generatedRidesId={generatedRidesId}
        token={token}
        onRideSelect={() => patchState({showParticipantsModal: false})}
        username={username}
        currentUsername={currentUsername}
      />
    </View>
  );
};

export default RideStep4;