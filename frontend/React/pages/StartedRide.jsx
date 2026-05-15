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
import startedRide from '../styles/screens/startedRide';
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

  const {activeRide, setActiveRide} = useContext(RideContext);
  const {activeRide: initialActiveRide} = route?.params || {};

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
    <View style={startedRide.container}>
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
        <View style={startedRide.mapHeaderSpacer} />

        <RouteMapView
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
              startedRide.pollingStatusPill,
              {
                borderColor: isPolling
                  ? 'rgba(76,175,80,0.4)'
                  : 'rgba(244,67,54,0.4)',
              },
            ]}>
            <View
              style={[
                startedRide.pollingStatusDot,
                {backgroundColor: isPolling ? '#4CAF50' : '#f44336'},
              ]}
            />
            <Text style={startedRide.pollingStatusText}>
              {isPolling ? 'Live' : pollingError ? 'Error' : 'Connecting…'}
            </Text>
          </View>
        )}

        {isOffline && (
          <View style={startedRide.offlineBanner}>
            <FontAwesome
              name="wifi"
              size={14}
              color="#fff"
              style={{opacity: 0.6}}
            />
            <Text style={startedRide.offlineBannerText}>
              No connection — location paused
            </Text>
          </View>
        )}

        <View style={startedRide.routeInfoOverlay}>
          <TouchableOpacity
            onPress={() => setShowRouteInfo(!showRouteInfo)}
            style={[
              startedRide.routeInfoHeader,
              showRouteInfo && startedRide.routeInfoHeaderExpanded,
            ]}>
            <View style={startedRide.routeInfoHeaderContent}>
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
              style={startedRide.routeScrollContainer}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={startedRide.routeScrollContent}>
              {/* Starting Point */}
              <View style={startedRide.routePointContainer}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View
                    style={[startedRide.routeMarker, startedRide.startMarker]}>
                    <Text>🚀</Text>
                  </View>
                  <Text style={startedRide.routeLabel}>STARTING POINT</Text>
                </View>
                <Text style={startedRide.routeLocationText}>
                  {mapData.startingPoint?.name ||
                    activeRide.startingPointName ||
                    'Starting Location'}
                </Text>
              </View>

              {/* Stop Points */}
              {mapData.stopPoints?.length > 0 && (
                <View>
                  {mapData.stopPoints.map((stop, index) => (
                    <View key={index} style={startedRide.routePointContainer}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <View
                          style={[
                            startedRide.routeMarker,
                            startedRide.stopMarker,
                          ]}>
                          <Text style={startedRide.routeMarkerNumber}>
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={startedRide.routeLabel}>
                          STOP POINT {index + 1}
                        </Text>
                      </View>
                      <Text style={startedRide.routeLocationText}>
                        {stop.name || `Stop ${index + 1}`}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Ending Point */}
              <View style={startedRide.routePointContainer}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View
                    style={[startedRide.routeMarker, startedRide.endMarker]}>
                    <Text>🏁</Text>
                  </View>
                  <Text style={startedRide.routeLabel}>ENDING POINT</Text>
                </View>
                <Text style={startedRide.routeLocationText}>
                  {mapData.endingPoint?.name ||
                    activeRide.endingPointName ||
                    'Ending Location'}
                </Text>
              </View>

              {/* Participants */}
              <View style={startedRide.participantsContainer}>
                <View style={startedRide.participantsHeader}>
                  <FontAwesome
                    name="users"
                    size={16}
                    color="#fff"
                    style={{marginRight: 8}}
                  />
                  <Text style={startedRide.participantsTitle}>
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
                      <View key={index} style={startedRide.participantItem}>
                        <View style={startedRide.participantAvatar}>
                          <Text style={startedRide.participantInitial}>
                            {(participantUsername || 'U')[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={startedRide.participantInfo}>
                          <Text style={startedRide.participantName}>
                            {participantUsername || 'Unknown User'}
                          </Text>
                          {liveLocation ? (
                            <Text style={startedRide.participantLocationText}>
                               {liveLocation.locationName} •{' '}
                              {Math.round(liveLocation.distanceMeters)}m away
                            </Text>
                          ) : (
                            <Text style={startedRide.participantWaitingText}>
                               Waiting for location…
                            </Text>
                          )}
                        </View>
                        <View
                          style={[
                            startedRide.participantStatusDot,
                            liveLocation
                              ? {backgroundColor: '#4CAF50'}
                              : startedRide.participantStatusActive,
                          ]}
                        />
                      </View>
                    );
                  })
                ) : (
                  <View style={startedRide.emptyParticipants}>
                    <FontAwesome name="user-plus" size={24} color="#666" />
                    <Text style={startedRide.emptyParticipantsText}>
                      No participants yet
                    </Text>
                  </View>
                )}

                {pollingError && (
                  <View style={startedRide.pollingErrorAlert}>
                    <Text style={startedRide.pollingErrorText}>
                      ⚠️ {pollingError}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Action Buttons */}
        <View style={startedRide.actionButtonsContainer}>
          <TouchableOpacity
            style={[startedRide.actionButton, {flex: 1}]}
            onPress={handleSwipeToDetails}>
            <FontAwesome name="info-circle" size={20} color="#fff" />
            <Text style={startedRide.actionButtonText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[startedRide.actionButton, {flex: 1}]}
            onPress={handleStopRide}
            disabled={isStopping}>
            {isStopping ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome name="stop-circle" size={20} color="#ff4444" />
            )}
            <Text style={[startedRide.actionButtonText, {color: '#ff4444'}]}>
              {isStopping ? 'Stopping…' : 'Stop'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default StartedRide;
