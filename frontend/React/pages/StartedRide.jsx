import React, {useState, useRef, useEffect, useMemo} from 'react';
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

const StartedRide = ({route, navigation}) => {
  const {activeRide, username: routeUsername} = route?.params || {};
  const {username: authUsername} = useAuth();
  const username = authUsername || routeUsername;

  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [riderMarkers, setRiderMarkers] = useState({});
  const [pollingError, setPollingError] = useState(null);
  const prevMarkersRef = useRef({});
  const [pillVisible, setPillVisible] = useState(true);
  const pillTimerRef = useRef(null);

  if (!activeRide) {
    return (
      <View style={feedback.emptyContainer}>
        <Text style={feedback.emptyText}>No ride data available</Text>
      </View>
    );
  }

  // ✅ FIX: Use startedRideId (Integer) instead of generatedRidesId (String)
  const rideId = activeRide.startedRideId;

  const mapData = useMemo(
    () => processRideCoordinates(activeRide),
    [activeRide],
  );

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

  // ── Location polling ──────────────────────────────────────────────────
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
              // Use generatedRidesId for deactivateRide
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
        <View
          style={{
            paddingVertical: 10,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(255,255,255,0.03)',
            marginBottom: 6,
          }}
        />

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

        {/* Polling status pill */}
        {pillVisible && (
          <View
            style={{
              position: 'absolute',
              top: 60,
              right: 16,
              backgroundColor: 'rgba(20, 20, 20, 0.85)',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: isPolling
                ? 'rgba(76,175,80,0.4)'
                : 'rgba(244,67,54,0.4)',
            }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isPolling ? '#4CAF50' : '#f44336',
              }}
            />
            <Text style={{color: '#fff', fontSize: 11}}>
              {isPolling ? 'Live' : pollingError ? 'Error' : 'Connecting…'}
            </Text>
          </View>
        )}

        {/* Offline banner */}
        {isOffline && (
          <View
            style={{
              position: 'absolute',
              bottom: 120,
              left: 16,
              right: 16,
              backgroundColor: 'rgba(30,30,30,0.9)',
              borderRadius: 8,
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
            <FontAwesome
              name="wifi"
              size={14}
              color="#fff"
              style={{opacity: 0.6}}
            />
            <Text style={{color: '#fff', fontSize: 11, fontWeight: '500'}}>
              No connection — location paused
            </Text>
          </View>
        )}

        {/* Route info overlay */}
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
              contentContainerStyle={startedRide.routeScrollContainer}>
              <View style={startedRide.routePointContainer}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View
                    style={[startedRide.routeMarker, startedRide.startMarker]}>
                    <Text style={startedRide.routeMarkerEmoji}>🚀</Text>
                  </View>
                  <Text style={startedRide.routeLabel}>STARTING POINT</Text>
                </View>
                <Text style={startedRide.routeLocationText}>
                  {mapData.startingPoint?.name ||
                    activeRide.startingPointName ||
                    'Starting Location'}
                </Text>
              </View>

              {mapData.stopPoints?.length > 0 && (
                <View style={startedRide.routePointContainer}>
                  {mapData.stopPoints.map((stop, index) => (
                    <View key={index} style={startedRide.stopPointWrapper}>
                      <View style={startedRide.routeRow}>
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

              <View style={startedRide.routePointContainer}>
                <View style={startedRide.routeRow}>
                  <View
                    style={[startedRide.routeMarker, startedRide.endMarker]}>
                    <Text style={startedRide.routeMarkerEmoji}>🏁</Text>
                  </View>
                  <Text style={startedRide.routeLabel}>ENDING POINT</Text>
                </View>
                <Text style={startedRide.routeLocationText}>
                  {mapData.endingPoint?.name ||
                    activeRide.endingPointName ||
                    'Ending Location'}
                </Text>
              </View>

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
                    const liveLocation = riderMarkers[participant.username];
                    return (
                      <View key={index} style={startedRide.participantItem}>
                        <View style={startedRide.participantAvatar}>
                          <Text style={startedRide.participantInitial}>
                            {(participant.username ||
                              participant.name ||
                              'U')[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={startedRide.participantInfo}>
                          <Text style={startedRide.participantName}>
                            {participant.username ||
                              participant.name ||
                              'Unknown User'}
                          </Text>
                          {liveLocation ? (
                            <Text
                              style={{
                                color: '#4CAF50',
                                fontSize: 11,
                                marginTop: 2,
                              }}>
                              📍 {liveLocation.locationName} •{' '}
                              {Math.round(liveLocation.distanceMeters)}m away
                            </Text>
                          ) : (
                            <Text
                              style={{
                                color: '#888',
                                fontSize: 11,
                                marginTop: 2,
                              }}>
                              ⏳ Waiting for location…
                            </Text>
                          )}
                        </View>
                        <View
                          style={[
                            startedRide.participantStatusDot,
                            liveLocation
                              ? {backgroundColor: '#4CAF50'}
                              : participant.isActive &&
                                startedRide.participantStatusActive,
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
                  <View
                    style={{
                      backgroundColor: 'rgba(244,67,54,0.1)',
                      borderRadius: 6,
                      padding: 10,
                      marginTop: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: '#f44336',
                    }}>
                    <Text style={{color: '#f44336', fontSize: 11}}>
                      ⚠️ {pollingError}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Action Buttons */}
        <View style={{flexDirection: 'row', gap: 10}}>
          <TouchableOpacity
            style={[
              startedRide.actionButton,
              {flex: 1, backgroundColor: 'rgba(140,35,35,0.9)'},
            ]}
            onPress={handleSwipeToDetails}>
            <FontAwesome name="info-circle" size={23} color="#fff" />
            <Text style={startedRide.actionButtonText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              startedRide.actionButton,
              {flex: 1, backgroundColor: 'rgba(30,30,30,0.95)'},
            ]}
            onPress={handleStopRide}
            disabled={isStopping}>
            {isStopping ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome name="stop-circle" size={23} color="#ff4444" />
            )}
            <Text style={[startedRide.actionButtonText, {color: '#ff4444'}]}>
              {isStopping ? 'Stopping…' : 'Stop Ride'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default StartedRide;
