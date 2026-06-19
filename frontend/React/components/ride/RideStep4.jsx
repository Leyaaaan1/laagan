import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

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
import buttons from '../../styles/base/buttons';
import header from '../../styles/base/header';
import rideStep4Styles from '../../styles/screens/rideStep4';
import mapStyles from '../../styles/components/mapStyles';
import {getLocationDisplayName} from './utilities/RideStepUtils';
import useJoinRide from './utilities/RideHandler';
import {useAuth} from '../../context/AuthContext';
import {RideContext} from '../../context/RideContext';
import useRideStatus, {RIDE_STATUS} from './hooks/useRideStatus';
import {
  RideActionButton,
  RideStatusCenterButton,
} from './utilities/RideActionButton';
import CheckpointArrivalsModal from '../../pages/utilities/CheckpointArrivalsModal';
import RideHeroCard from './utilities/RideHeroCard';
import {joinService} from '../../services/joinService';
import {captureRideSnapshot} from '../../utilities/captureRideSnapshot';
import RideSnapshotView from '../../utilities/route/view/RideSnapshotView';

const RideStep4 = props => {
  const navigation = useNavigation();
  const {username: authUsername} = useAuth();
  // Pull fetchActiveRide so we can populate context with startedRideId
  // immediately after starting a ride (fixes "Connecting…" on first open).
  const {
    fetchActiveRide: fetchActiveRideCtx,
    setActiveRide: setContextActiveRide,
  } = React.useContext(RideContext);
  const mapRef = useRef(null);
  const snapshotRef = useRef(null);
  const routeParams = props.route?.params || {};
  const merged = {...props, ...routeParams};
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
    active: isRideStarted = false,
    rideDetailsWithCoords: passedRideDetails = null,
    skipCoordsFetch = false,
  } = merged;

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

  const resolvedCurrentUsername = currentUsername || authUsername;
  const hasFetchedRef = useRef(skipCoordsFetch && !!passedRideDetails);
  const {joinRide} = useJoinRide();
  const insets = useSafeAreaInsets();
  const [pendingJoinCount, setPendingJoinCount] = useState(0);

  const {
    actionStatus,
    loading: actionStatusLoading,
    refresh: refreshStatus,
  } = useRideStatus({
    generatedRidesId,
    username,
    resolvedCurrentUsername,
    participants,
    isRideStarted,
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
    showCheckpointsModal: false,
    rideDetailsWithCoords: passedRideDetails || null,
  });

  const patchState = patch => setState(prev => ({...prev, ...patch}));

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

  useEffect(() => {
    if (!generatedRidesId) return;
    patchState({imageLoading: true});
    fetchRideMapImage(generatedRidesId)
      .then(url => patchState({mapImage: url}))
      .catch(err => console.error('Map image fetch error:', err?.message))
      .finally(() => patchState({imageLoading: false}));
  }, [generatedRidesId]);

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
        patchState({imageLoading: false});
      });
  }, [generatedRidesId]);

  useEffect(() => {
    if (!generatedRidesId) return;

    let interval;

    const fetchPendingCount = async () => {
      try {
        const count = await joinService.getPendingJoinCount(generatedRidesId);
        setPendingJoinCount(count);

        const nextInterval = count > 0 ? 15_000 : 60_000;
        clearInterval(interval);
        interval = setInterval(fetchPendingCount, nextInterval);
      } catch (_) {}
    };

    fetchPendingCount();
    interval = setInterval(fetchPendingCount, 60_000);
    return () => clearInterval(interval);
  }, [generatedRidesId]);

  // ── Shared active-ride object (used by StartedRide + CheckpointArrivalsModal)
  const buildActiveRide = () => {
    const rideDetails = state.rideDetailsWithCoords;
    return {
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
      startingPointName: rideDetails?.startingPointName || startingPointName,
      endingPointName: rideDetails?.endingPointName || endingPointName,
      startingPoint: mapCoords.startingPoint,
      endingPoint: mapCoords.endingPoint,
      stopPoints: mapCoords.stopPoints || [],
      participants: participants || [],
      mapImage: state.mapImage || null,
      startMapImage: state.startMapImage || null,
      endMapImage: state.endMapImage || null,
      rideNameImage: state.rideNameImage || [],
      isActive: true,
    };
  };

  // ── Shared FinishedRideView params ────────────────────────────────────────
  const buildFinishedRideParams = (id = generatedRidesId) => ({
    generatedRidesId: id,
    isRideActive: false,
    rideName,
    startingPointName,
    endingPointName,
    stopPoints: mapCoords.stopPoints || [],
    participants: participants || [],
    participantCount: participants?.length ?? 0,
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleJoinRide = () => {
    if (actionStatus.isOwner) {
      Alert.alert('Info', 'You are the owner of this ride.');
      return;
    }
    if (!generatedRidesId) {
      Alert.alert('Error', 'Missing ride information. Please try again.');
      return;
    }
    joinRide(generatedRidesId, null, () => refreshStatus());
  };

  const handleSwipeToMap = () => {
    navigation.navigate('StartedRide', {
      activeRide: buildActiveRide(),
      username: resolvedCurrentUsername,
    });
  };

  const handleStartRide = async () => {
    try {
      await startService.startRide(generatedRidesId);
      await refreshStatus();

      const activeRideData = {
        ...buildActiveRide(),
        startingPointName:
          mapCoords.startingPoint?.name ||
          getLocationDisplayName(startingPoint),
        endingPointName:
          mapCoords.endingPoint?.name || getLocationDisplayName(endingPoint),
      };

      setContextActiveRide(activeRideData);
      fetchActiveRideCtx(); // fire-and-forget — updates context with startedRideId

      navigation.navigate('StartedRide', {
        activeRide: activeRideData,
        username: resolvedCurrentUsername,
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start the ride.');
    }
  };

  /**
   * Bottom-bar center button:
   *   FINISHED          → FinishedRideView (full group summary)
   *   PERSONAL_FINISHED → PersonalSummaryView
   *   ACTIVE            → CheckpointArrivalsModal (slide-up, same as ParticipantList)
   */
  const handleCenterAction = () => {
    const {rideStatus} = actionStatus;

    if (rideStatus === RIDE_STATUS.FINISHED) {
      navigation.navigate('FinishedRideView', buildFinishedRideParams());
      return;
    }

    if (rideStatus === RIDE_STATUS.PERSONAL_FINISHED) {
      navigation.navigate('PersonalSummaryView', {generatedRidesId});
      return;
    }

    // ACTIVE → modal
    patchState({showCheckpointsModal: true});
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={rideStep4Styles.container}>
      <StatusBar
        backgroundColor="#000"
        barStyle="light-content"
        translucent={false}
      />
      {/* Header */}
      <View style={[header.bar, {paddingTop: insets.top}]}>
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
            hasJoined={actionStatus.hasJoined}
            hasPendingRequest={actionStatus.hasPendingRequest}
            rideStatus={actionStatus.rideStatus}
            onJoin={handleJoinRide}
            onStart={handleStartRide}
            onViewStarted={handleSwipeToMap}
            isLoading={actionStatusLoading}
          />
        </View>
      </View>
      <View style={rideStep4Styles.fadeContainer}>
        {/* Map */}
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
              ref={mapRef}
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

          {/* Bottom nav */}
          <View style={[header.bottomNav, {paddingBottom: insets.bottom + 8}]}>
            <TouchableOpacity
              style={buttons.bottomNav}
              onPress={() => patchState({showParticipantsModal: true})}>
              <View style={{position: 'relative'}}>
                <FontAwesome name="users" size={18} color="#fff" />
                {pendingJoinCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -8,
                      backgroundColor: '#e53935',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}>
                    <Text
                      style={{color: '#fff', fontSize: 9, fontWeight: 'bold'}}>
                      {pendingJoinCount > 99 ? '99+' : pendingJoinCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={buttons.textNav}>Riders</Text>
            </TouchableOpacity>
            <View style={header.bottomNavDivider} />

            <TouchableOpacity
              style={buttons.bottomNav}
              onPress={() => {
                navigation.navigate('RideRoutesPage', {
                  startingPoint: getLocationDisplayName(startingPointName),
                  endingPoint: getLocationDisplayName(endingPointName),
                  generatedRidesId,
                  stopPoints,
                });
              }}>
              <FontAwesome name="map-marker" size={18} color="#fff" />
              <Text style={buttons.textNav}>Stop Points</Text>
            </TouchableOpacity>

            {/* Status-driven center button — null when NOT_STARTED */}
            <RideStatusCenterButton
              rideStatus={actionStatus.rideStatus}
              onPress={handleCenterAction}
            />
          </View>
        </ScrollView>
      </View>
      {/* Participants modal */}
      <ParticipantList
        visible={state.showParticipantsModal}
        onClose={() => patchState({showParticipantsModal: false})}
        participants={participants}
        generatedRidesId={generatedRidesId}
        username={username}
        currentUsername={resolvedCurrentUsername}
        navigation={navigation}
      />
      <RideSnapshotView
        ref={snapshotRef}
        startingPoint={mapCoords.startingPoint}
        endingPoint={mapCoords.endingPoint}
        stopPoints={mapCoords.stopPoints}
        routeCoordinates={[]} // RideStep4 has no live GeoJSON, landmarks-only is fine
      />
      <CheckpointArrivalsModal
        visible={state.showCheckpointsModal}
        onClose={() => patchState({showCheckpointsModal: false})}
        generatedRidesId={generatedRidesId}
        stopPoints={mapCoords.stopPoints || []}
        endingPointName={
          state.rideDetailsWithCoords?.endingPointName ||
          getLocationDisplayName(endingPointName)
        }
        username={resolvedCurrentUsername}
        isCreator={actionStatus.isOwner}
        activeRide={buildActiveRide()}
        stopPolling={null}
        setPollingEnabled={null}
        onRideFinished={(data, snapshotUrl) => {
          patchState({showCheckpointsModal: false});
          refreshStatus();
          if (data) {
            navigation.navigate('FinishedRideView', {
              finishedRideData: data,
              snapshotUrl,
            });
          }
        }}
        onNavigateToSummary={async id => {
          patchState({showCheckpointsModal: false});
          let snapshotUri = null;
          const containerRef = mapRef.current?.getContainerRef?.();
          if (containerRef) {
            const result = await captureRideSnapshot({
              containerRef,
              generatedRidesId: id,
            });
            if (!result.skipped) snapshotUri = result.snapshotUri;
          }
          if (!snapshotUri) {
            try {
              const {getSnapshot} = await import('../../services/startService');
              const res = await getSnapshot(id);
              snapshotUri = res?.snapshotUrl ?? null;
            } catch (_) {}
          }
          navigation.navigate('FinishedRideView', {
            ...buildFinishedRideParams(id),
            snapshotUrl: snapshotUri,
          });
        }}
        onNavigateToPersonalSummary={async id => {
          patchState({showCheckpointsModal: false});
          let snapshotUri = null;
          const containerRef = mapRef.current?.getContainerRef?.();
          if (containerRef) {
            const result = await captureRideSnapshot({
              containerRef,
              generatedRidesId: id,
            });
            if (!result.skipped) snapshotUri = result.snapshotUri;
          }
          if (!snapshotUri) {
            try {
              const {getSnapshot} = await import('../../services/startService');
              const res = await getSnapshot(id);
              snapshotUri = res?.snapshotUrl ?? null;
            } catch (_) {}
          }
          navigation.navigate('PersonalSummaryView', {
            generatedRidesId: id,
            snapshotUri,
          });
        }}
        snapshotContainerRef={snapshotRef}
      />
    </View>
  );
};

export default RideStep4;
