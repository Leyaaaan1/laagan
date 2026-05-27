import React, {useState, useRef, useEffect, useMemo, useContext} from 'react';
import {
  View,
  Text,
  StatusBar,
  Animated,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {processRideCoordinates} from '../utilities/CoordinateUtils';
import startedRideStyles from '../styles/screens/startedRideStyles';
import rideRoutes from '../styles/screens/rideRoutes';
import feedback from '../styles/base/feedback';
import AdaptiveMapView from '../utilities/route/view/AdaptiveMapView';
import {useAuth} from '../context/AuthContext';
import {RideContext} from '../context/RideContext';
import {buildRideStep4Params} from '../utilities/NavigationParamsBuilder';
import {buildMapData, buildRouteDataForMap} from './utilities/startedRideUtils';
import {useStartedRideMarkers} from './utilities/hooks/useStartedRideMarkers';
import {useStartedRideRouteCache} from './utilities/hooks/useStartedRideRouteCache';
import {usePollingStatusPill} from './utilities/hooks/usePollingStatusPill';
import {useStartedRideHandler} from './utilities/hooks/useStartedRideHandler';
import {useOfflineRouteCache} from './utilities/hooks/useOfflineRouteCache';
import CheckpointArrivalsModal from './utilities/CheckpointArrivalsModal';
import {useEndingPointAlert} from '../hooks/useEndingPointAlert';
import {
  getFinishedRideSummary,
  getPersonalSummary,
} from '../services/startService';

const StartedRide = ({route, navigation}) => {
  const {username: routeUsername} = route?.params || {};
  const {username: authUsername} = useAuth();
  const username = authUsername || routeUsername;
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const mapRef = useRef(null);
  const {activeRide, setActiveRide, stopPolling, startPolling} =
    useContext(RideContext);
  const {activeRide: initialActiveRide} = route?.params || {};
  const [checkpointModalVisible, setCheckpointModalVisible] = useState(false);

  const {riderMarkers, pollingError, isPolling, isOffline} =
    useStartedRideMarkers(activeRide?.startedRideId, pollingEnabled);

  // Cache route when online
  useStartedRideRouteCache(activeRide);

  const {cachedRouteData} = useOfflineRouteCache(
    activeRide?.generatedRidesId,
    isOffline,
  );

  const pillVisible = usePollingStatusPill(isPolling, pollingError);
  const {isLeaving, handleLeaveRide} = useStartedRideHandler(
    activeRide,
    username,
    stopPolling,
    setPollingEnabled,
  );

  const isCreator =
    username === activeRide?.startedBy || username === activeRide?.username;

  const {showEndingAlert} = useEndingPointAlert(
    activeRide?.generatedRidesId,
    username,
    pollingEnabled,
  );
  useEffect(() => {
    if (showEndingAlert) {
      setCheckpointModalVisible(true);
    }
  }, [showEndingAlert]);

  useEffect(() => {
    if (initialActiveRide && !activeRide) {
      setActiveRide(initialActiveRide);
    }
  }, [initialActiveRide, activeRide, setActiveRide]);

  useEffect(() => {}, [activeRide, isOffline]);

  useEffect(() => {
    startPolling();

    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  const mapData = useMemo(
    () => buildMapData(activeRide, processRideCoordinates),
    [activeRide],
  );

  const routeDataForMap = useMemo(() => {
    if (isOffline && cachedRouteData) {
      if (cachedRouteData.routeCoordinates) {
        try {
          const parsed = JSON.parse(cachedRouteData.routeCoordinates);
          return parsed; // ← This is the fix!
        } catch (err) {
          return null;
        }
      }
      return null;
    }
    if (activeRide) {
      return buildRouteDataForMap(activeRide);
    }
    return null;
  }, [activeRide, isOffline, cachedRouteData]);

  if (!activeRide) {
    return (
      <View style={feedback.emptyContainer}>
        <Text style={feedback.emptyText}>No ride data available</Text>
      </View>
    );
  }

  const handleSwipeToDetails = () => {
    const params = buildRideStep4Params(activeRide, username);
    navigation.navigate('RideStep4', params);
  };

  const handleFocusOnRider = participantUsername => {
    const liveLocation = riderMarkers[participantUsername];
    if (!liveLocation || !mapRef.current) return;

    mapRef.current.focusOnRider(
      liveLocation.latitude,
      liveLocation.longitude,
      participantUsername,
    );
  };

  const handleViewModal = () => {
    setCheckpointModalVisible(true);
  };

  const handleCloseModal = () => {
    setCheckpointModalVisible(false);
  };

  // ── Participant: fetch their personal summary (ride may still be active) ──
  const handleNavigateToPersonalSummary = async rideId => {
    handleCloseModal();
    try {
      const data = await getPersonalSummary(rideId);
      navigation.navigate('FinishedRideView', {
        finishedRideData: data,
        isPersonalSummary: true,
      });
    } catch (e) {
      navigation.navigate('FinishedRideView', {
        generatedRidesId: rideId,
        isPersonalSummary: true,
      });
    }
  };

  return (
    <View style={startedRideStyles.container}>
      <StatusBar
        translucent
        barStyle="light-content"
        backgroundColor="transparent"
      />
      <Animated.View
        style={[
          rideRoutes.mapSection,
          {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
        ]}>
        <View style={startedRideStyles.mapHeaderSpacer} />

        <AdaptiveMapView
          ref={mapRef}
          isOffline={isOffline}
          generatedRidesId={activeRide.generatedRidesId}
          startingPoint={mapData.startingPoint}
          endingPoint={mapData.endingPoint}
          stopPoints={mapData.stopPoints}
          style={{flex: 1}}
          routeData={routeDataForMap}
          isDark={true}
          riderMarkers={riderMarkers}
          currentUsername={username}
        />

        {pillVisible && (
          <View
            style={[
              startedRideStyles.pollingStatusPill,
              {
                borderColor: isPolling
                  ? 'rgba(76,175,80,0.4)'
                  : 'rgba(244,67,54,0.4)',
              },
            ]}>
            <View
              style={[
                startedRideStyles.pollingStatusDot,
                {backgroundColor: isPolling ? '#4CAF50' : '#f44336'},
              ]}
            />
            <Text style={startedRideStyles.pollingStatusText}>
              {isPolling ? 'Live' : pollingError ? 'Offline' : 'Connecting…'}
            </Text>
          </View>
        )}

        {/* Checkpoint Swipeable Tab - Left Side */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: [{translateY: -20}],
            backgroundColor: 'rgba(30,64,175,0.9)',
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            zIndex: 10,
          }}
          onPress={handleViewModal}>
          <FontAwesome name="map-signs" size={18} color="#fff" />
          <FontAwesome name="chevron-right" size={14} color="#fff" />
        </TouchableOpacity>

        <View
          style={[
            startedRideStyles.routeInfoOverlay,
            {pointerEvents: 'box-none'},
          ]}>
          <TouchableOpacity
            pointerEvents="auto"
            onPress={() => setShowRouteInfo(!showRouteInfo)}
            style={[
              startedRideStyles.routeInfoHeader,
              showRouteInfo && startedRideStyles.routeInfoHeaderExpanded,
            ]}>
            <View style={startedRideStyles.routeInfoHeaderContent}>
              <FontAwesome
                name="map-marker"
                size={18}
                color="#fff"
                style={{marginRight: 8}}
              />
            </View>
            <FontAwesome
              name={showRouteInfo ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#fff"
            />
          </TouchableOpacity>

          {showRouteInfo && (
            <ScrollView
              pointerEvents="auto"
              style={startedRideStyles.routeScrollContainer}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={startedRideStyles.routeScrollContent}
              scrollEnabled={true}
              nestedScrollEnabled={true}>
              {/* Starting Point */}
              <View style={startedRideStyles.routePointContainer}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View
                    style={[
                      startedRideStyles.routeMarker,
                      startedRideStyles.startMarker,
                    ]}>
                    <Text>🚀</Text>
                  </View>
                  <Text style={startedRideStyles.routeLabel}>
                    STARTING POINT
                  </Text>
                </View>
                <Text style={startedRideStyles.routeLocationText}>
                  {mapData.startingPoint?.name ||
                    activeRide.startingPointName ||
                    'Starting Location'}
                </Text>
              </View>

              {/* Stop Points */}
              {mapData.stopPoints?.length > 0 && (
                <View>
                  {mapData.stopPoints.map((stop, index) => (
                    <View
                      key={index}
                      style={startedRideStyles.routePointContainer}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <View
                          style={[
                            startedRideStyles.routeMarker,
                            startedRideStyles.stopMarker,
                          ]}>
                          <Text style={startedRideStyles.routeMarkerNumber}>
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={startedRideStyles.routeLabel}>
                          STOP POINT {index + 1}
                        </Text>
                      </View>
                      <Text style={startedRideStyles.routeLocationText}>
                        {stop.name || `Stop ${index + 1}`}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Ending Point */}
              <View style={startedRideStyles.routePointContainer}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View
                    style={[
                      startedRideStyles.routeMarker,
                      startedRideStyles.endMarker,
                    ]}>
                    <Text>🏁</Text>
                  </View>
                  <Text style={startedRideStyles.routeLabel}>ENDING POINT</Text>
                </View>
                <Text style={startedRideStyles.routeLocationText}>
                  {mapData.endingPoint?.name ||
                    activeRide.endingPointName ||
                    'Ending Location'}
                </Text>
              </View>

              {/* Participants */}
              <View style={startedRideStyles.participantsContainer}>
                <View style={startedRideStyles.participantsHeader}>
                  <FontAwesome
                    name="users"
                    size={16}
                    color="#fff"
                    style={{marginRight: 8}}
                  />
                  <Text style={startedRideStyles.participantsTitle}>
                    PARTICIPANTS ({activeRide.participants?.length ?? 0})
                  </Text>
                </View>

                {activeRide.participants?.length > 0 ? (
                  activeRide.participants.map((participant, index) => {
                    const participantUsername =
                      typeof participant === 'string'
                        ? participant
                        : participant?.username;
                    const liveLocation = riderMarkers[participantUsername];

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          startedRideStyles.participantItem,
                          liveLocation && {
                            borderColor: 'rgba(76,175,80,0.3)',
                          },
                        ]}
                        onPress={() => handleFocusOnRider(participantUsername)}
                        disabled={!liveLocation}
                        activeOpacity={0.7}>
                        <View style={startedRideStyles.participantAvatar}>
                          <Text style={startedRideStyles.participantInitial}>
                            {(participantUsername || 'U')[0].toUpperCase()}
                          </Text>
                        </View>

                        <View style={startedRideStyles.participantInfo}>
                          <Text style={startedRideStyles.participantName}>
                            {participantUsername || 'Unknown User'}
                          </Text>
                          {liveLocation ? (
                            <Text
                              style={startedRideStyles.participantLocationText}>
                              {liveLocation.locationName} •{' '}
                              {Math.round(liveLocation.distanceMeters)}m away
                            </Text>
                          ) : (
                            <Text
                              style={startedRideStyles.participantWaitingText}>
                              Waiting for location…
                            </Text>
                          )}
                        </View>

                        <View
                          style={[
                            startedRideStyles.participantStatusDot,
                            liveLocation
                              ? {backgroundColor: '#4CAF50'}
                              : startedRideStyles.participantStatusActive,
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={startedRideStyles.emptyParticipants}>
                    <FontAwesome name="user-plus" size={24} color="#666" />
                    <Text style={startedRideStyles.emptyParticipantsText}>
                      No participants yet
                    </Text>
                  </View>
                )}

                {pollingError && (
                  <View style={startedRideStyles.pollingErrorAlert}>
                    <Text style={startedRideStyles.pollingErrorText}>
                      ⚠️ {pollingError}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
        {/* Action Buttons */}
        <View style={[startedRideStyles.actionButtonsContainer, {padding: 8}]}>
          <View
            style={[
              startedRideStyles.actionPill,
              {paddingHorizontal: 8, paddingVertical: 6, minHeight: 40},
            ]}>
            <TouchableOpacity
              style={{flexDirection: 'row', alignItems: 'center', gap: 6}}
              onPress={handleSwipeToDetails}>
              <FontAwesome
                name="info-circle"
                size={16}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={startedRideStyles.actionDetailsLabel}>Details</Text>
            </TouchableOpacity>
            <View style={startedRideStyles.actionPillDivider} />
            <TouchableOpacity
              style={[
                startedRideStyles.actionStopButton,
                {backgroundColor: 'rgba(255,255,255,0.15)'},
              ]}
              onPress={() => handleLeaveRide(navigation)}
              disabled={isLeaving}>
              {isLeaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome name="sign-out" size={14} color="#fff" />
              )}
              <Text style={startedRideStyles.actionStopLabel}>
                {isLeaving ? 'Leaving…' : 'Leave'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      <CheckpointArrivalsModal
        visible={checkpointModalVisible}
        onClose={handleCloseModal}
        generatedRidesId={activeRide?.generatedRidesId}
        stopPoints={mapData.stopPoints}
        endingPointName={activeRide?.endingPointName}
        username={username}
        isCreator={isCreator}
        activeRide={activeRide}
        stopPolling={stopPolling}
        setPollingEnabled={setPollingEnabled}
        onRideFinished={data => {
          handleCloseModal();
          navigation.navigate('FinishedRideView', {finishedRideData: data});
        }}
        onNavigateToSummary={async generatedRidesId => {
          handleCloseModal();
          try {
            const data = await getFinishedRideSummary(generatedRidesId);
            navigation.navigate('FinishedRideView', {finishedRideData: data});
          } catch (e) {
            // fallback: let FinishedRideView fetch it on its own
            navigation.navigate('FinishedRideView', {generatedRidesId});
          }
        }}
        onNavigateToPersonalSummary={handleNavigateToPersonalSummary}
      />
    </View>
  );
};

export default StartedRide;
