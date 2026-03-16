import React, { useState } from 'react';
import {View, Text, StatusBar, Animated, TouchableOpacity, ScrollView} from 'react-native';
import RouteMapView from '../utilities/route/RouteMapView';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {processRideCoordinates} from '../utilities/route/CoordinateUtils';
import startedRide from '../styles/screens/startedRide';
import rideRoutes from '../styles/screens/rideRoutes';
import modal from '../styles/components/modal';
import feedback from '../styles/base/feedback';

const StartedRide = ({ route, navigation }) => {
  const { activeRide, token } = route.params || {};
  const [showRouteInfo, setShowRouteInfo] = useState(false);


  if (!activeRide) {
    return (
      <View style={feedback.emptyContainer}>
        <Text style={feedback.emptyText}>No ride data available</Text>
      </View>
    );
  }

  const mapData = processRideCoordinates(activeRide);

  const handleSwipeToDetails = () => {
    navigation.navigate('RideStep4', {
      generatedRidesId: activeRide.generatedRidesId || activeRide.id,
      rideName: activeRide.rideName,
      locationName: activeRide.locationName,
      riderType: activeRide.riderType,
      date: activeRide.date,
      startingPoint: activeRide.startingPoint,
      endingPoint: activeRide.endingPoint,
      participants: activeRide.participants,
      description: activeRide.description,
      token: token,
      distance: activeRide.distance,
      username: activeRide.username,
      stopPoints: activeRide.stopPoints,
      currentUsername: activeRide.username,
      rideDetailsWithCoords: null,
    });
  };

  return (
    <View style={startedRide.container}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <Animated.View style={[rideRoutes.mapSection, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
        <View style={{ paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.03)', marginBottom: 6 }} />

        <RouteMapView
          generatedRidesId={activeRide.generatedRidesId || activeRide.id}
          startingPoint={mapData.startingPoint}
          endingPoint={mapData.endingPoint}
          stopPoints={mapData.stopPoints}
          token={token}
          style={{ flex: 1 }}
          isDark={true}
        />

        {/* Route Info Overlay - Fixed Size with ScrollView */}
        <View style={startedRide.routeInfoOverlay}>
          {/* Header - Always Visible */}
          <TouchableOpacity
            onPress={() => setShowRouteInfo(!showRouteInfo)}
            style={[
              startedRide.routeInfoHeader,
              showRouteInfo && startedRide.routeInfoHeaderExpanded,
            ]}
          >
            <View style={startedRide.routeInfoHeaderContent}>
              <FontAwesome name="map-marker" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={startedRide.routeInfoTitle}>
                Route Information
              </Text>
            </View>
            <FontAwesome
              name={showRouteInfo ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Collapsible Content with Fixed Height and Scrolling */}
          {showRouteInfo && (
            <ScrollView
              style={startedRide.routeInfoScrollContainer}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={startedRide.routeInfoScrollContent}
            >
              {/* Starting Point */}
              <View style={startedRide.routePointContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[startedRide.routeMarker, startedRide.startMarker]}>
                    <Text style={startedRide.routeMarkerEmoji}>🚀</Text>
                  </View>
                  <Text style={startedRide.routeLabel}>
                    STARTING POINT
                  </Text>
                </View>
                <Text style={startedRide.routeLocationText}>
                  {mapData.startingPoint?.name ||
                    activeRide.startingPointName ||
                    'Starting Location'}
                </Text>
              </View>

              {/* Stop Points */}
              {mapData.stopPoints && mapData.stopPoints.length > 0 && (
                <View style={startedRide.routePointContainer}>
                  {mapData.stopPoints.map((stop, index) => (
                    <View key={index} style={startedRide.stopPointWrapper}>
                      <View style={startedRide.routeRow}>
                        <View style={[startedRide.routeMarker, startedRide.stopMarker]}>
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
                <View style={startedRide.routeRow}>
                  <View style={[startedRide.routeMarker, startedRide.endMarker]}>
                    <Text style={startedRide.routeMarkerEmoji}>🏁</Text>
                  </View>
                  <Text style={startedRide.routeLabel}>
                    ENDING POINT
                  </Text>
                </View>
                <Text style={startedRide.routeLocationText}>
                  {mapData.endingPoint?.name ||
                    activeRide.endingPointName ||
                    'Ending Location'}
                </Text>
              </View>

              {/* Participants Section */}
              <View style={startedRide.participantsContainer}>
                <View style={startedRide.participantsHeader}>
                  <FontAwesome name="users" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={startedRide.participantsTitle}>
                    PARTICIPANTS ({activeRide.participants.length})
                  </Text>
                </View>

                {activeRide.participants.length > 0 ? (
                  activeRide.participants.map((participant, index) => (
                    <View key={index} style={startedRide.participantItem}>
                      <View style={startedRide.participantAvatar}>
                        <Text style={startedRide.participantInitial}>
                          {(participant.username || participant.name || 'U')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={startedRide.participantInfo}>
                        <Text style={startedRide.participantName}>
                          {participant.username || participant.name || 'Unknown User'}
                        </Text>
                        {participant.status && (
                          <Text style={startedRide.participantStatus}>
                            {participant.status}
                          </Text>
                        )}
                      </View>
                      <View style={[
                        startedRide.participantStatusDot,
                        participant.isActive && startedRide.participantStatusActive
                      ]} />
                    </View>
                  ))
                ) : (
                  <View style={startedRide.emptyParticipants}>
                    <FontAwesome name="user-plus" size={24} color="#666" />
                    <Text style={startedRide.emptyParticipantsText}>
                      No participants yet
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Action Buttons at Bottom */}
        <TouchableOpacity
          style={[startedRide.actionButton, { backgroundColor: 'rgba(140, 35, 35, 0.9)' }]}
          onPress={handleSwipeToDetails}
        >
          <FontAwesome name="info-circle" size={23} color="#fff" />
          <Text style={startedRide.actionButtonText}>Details</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default StartedRide;