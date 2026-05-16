import React, {useState, useRef, useEffect, useMemo, useContext} from 'react';
import {
  View,
  Text,
  StatusBar,
  Animated,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {processRideCoordinates} from '../utilities/CoordinateUtils';
import startedRideStyles from '../styles/screens/startedRideStyles';
import rideRoutes from '../styles/screens/rideRoutes';
import feedback from '../styles/base/feedback';
import RouteMapView from '../utilities/route/view/RouteMapView';
import {startService} from '../services/startService';
import {useRideLocationPolling} from '../hooks/useRideLocationPolling';
import {buildRideStep4Params} from '../utilities/NavigationParamsBuilder';
import {useAuth} from '../context/AuthContext';
import {RideContext} from '../context/RideContext';

const StartedRide = ({route, navigation}) => {
  const {username: routeUsername} = route?.params || {};
  const {username: authUsername} = useAuth();
  const username = authUsername || routeUsername;

  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [riderMarkers, setRiderMarkers] = useState({});
  const [pollingError, setPollingError] = useState(null);
  const prevMarkersRef = useRef({});
  const [pillVisible, setPillVisible] = useState(true);
  const pillTimerRef = useRef(null);

  const mapRef = useRef(null);

  const {activeRide, setActiveRide} = useContext(RideContext);
  const {activeRide: initialActiveRide} = route?.params || {};

  useEffect(() => {
    console.log('🔍 activeRide:', activeRide);
    console.log('🔍 generatedRidesId:', activeRide?.generatedRidesId);
  }, [activeRide]);

  useEffect(() => {
    if (initialActiveRide && !activeRide) {
      setActiveRide(initialActiveRide);
    }
  }, [initialActiveRide, activeRide, setActiveRide]);

  const rideId = activeRide?.startedRideId;

  const mapData = useMemo(
    () => processRideCoordinates(activeRide),
    [activeRide],
  );

  const {
    isPolling,
    error: pollingHookError,
    retryCount,
    isOffline,
  } = useRideLocationPolling({
    rideId,
    onLocationsUpdate: locations => {
      const markers = {};
      locations.forEach(loc => {
        markers[loc.username] = {
          latitude: loc.latitude,
          longitude: loc.longitude,
          updatedAt: loc.timestamp,
          locationName: loc.locationName,
          distanceMeters: loc.distanceMeters,
        };
      });

      let hasChanged = false;
      if (
        Object.keys(markers).length !==
        Object.keys(prevMarkersRef.current).length
      ) {
        hasChanged = true;
      } else {
        for (const u in markers) {
          const prev = prevMarkersRef.current[u];
          const curr = markers[u];
          if (
            !prev ||
            Math.abs(prev.latitude - curr.latitude) > 0.00001 ||
            Math.abs(prev.longitude - curr.longitude) > 0.00001
          ) {
            hasChanged = true;
            break;
          }
        }
      }

      if (hasChanged) {
        setRiderMarkers(markers);
        prevMarkersRef.current = markers;
      }
      setPollingError(null);
    },
    onError: err => {
      setPollingError(err.message);
      console.error('Location polling failed:', err);
    },
  });

  useEffect(() => {
    if (isPolling && !pollingError) {
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
      pillTimerRef.current = setTimeout(() => setPillVisible(false), 3000);
      setPillVisible(true);
    } else if (pollingError || !isPolling) {
      setPillVisible(true);
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    }
    return () => {
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    };
  }, [riderMarkers, isPolling, pollingError]);

  // ✅ Check AFTER all hooks
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
    if (!liveLocation) return; // no location yet, do nothing
    if (!mapRef.current) return;

    mapRef.current.focusOnRider(
      liveLocation.latitude,
      liveLocation.longitude,
      participantUsername,
    );
  };

  const handleStopRide = () => {
    Alert.alert(
      'Stop Ride',
      'Are you sure you want to stop this ride? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Stop Ride',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsStopping(true);
              await startService.deactivateRide(activeRide.generatedRidesId);
              const params = buildRideStep4Params(activeRide, username);
              navigation.reset({
                index: 1,
                routes: [
                  {name: 'RiderPage', params: {username}},
                  {name: 'RideStep4', params},
                ],
              });
            } catch (error) {
              Alert.alert(
                'Error',
                error.message || 'Failed to stop the ride. Please try again.',
              );
            } finally {
              setIsStopping(false);
            }
          },
        },
      ],
      {cancelable: true},
    );
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
        <RouteMapView
          ref={mapRef}
          generatedRidesId={activeRide.generatedRidesId}
          startingPoint={mapData.startingPoint}
          endingPoint={mapData.endingPoint}
          stopPoints={mapData.stopPoints}
          style={{flex: 1}}
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
              {isPolling ? 'Live' : pollingError ? 'Error' : 'Connecting…'}
            </Text>
          </View>
        )}
        {isOffline && (
          <View style={startedRideStyles.offlineBanner}>
            <FontAwesome
              name="wifi"
              size={14}
              color="#fff"
              style={{opacity: 0.6}}
            />
            <Text style={startedRideStyles.offlineBannerText}>
              No connection — location paused
            </Text>
          </View>
        )}
        <View style={startedRideStyles.routeInfoOverlay}>
          <TouchableOpacity
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
              style={startedRideStyles.routeScrollContainer}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={startedRideStyles.routeScrollContent}>
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
                        style={{flexDirection: 'row', alignItems: 'center'}}>
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
                          liveLocation && {borderColor: 'rgba(76,175,80,0.3)'},
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
        <View style={startedRideStyles.actionButtonsContainer}>
          <View style={startedRideStyles.actionPill}>
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
              style={startedRideStyles.actionStopButton}
              onPress={handleStopRide}
              disabled={isStopping}>
              {isStopping ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome name="stop-circle" size={14} color="#fff" />
              )}
              <Text style={startedRideStyles.actionStopLabel}>
                {isStopping ? 'Stopping…' : 'Stop ride'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default StartedRide;
