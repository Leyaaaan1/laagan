// React/components/ride/RideStep4.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import modernRideStyles from '../../styles/modernRideStyles';
import { useNavigation } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { fetchRideMapImage, getRideDetails, getLocationImage } from '../../services/rideService';
import ParticipantListModal from './modal/ParticipantListModal';
import useJoinRide from './util/RideHandler';
import { startService } from '../../services/startService';
import RouteMapView from '../../utilities/route/RouteMapView';
import {processRideCoordinates} from '../../utilities/route/CoordinateUtils';

const RideStep4 = (props) => {
  const navigation = useNavigation();
  const route = props.route || {};
  const routeParams = route.params || {};

  const {
    generatedRidesId = props.generatedRidesId || routeParams.generatedRidesId,
    rideName = props.rideName || routeParams.rideName,
    locationName = props.locationName || routeParams.locationName,
    riderType = props.riderType || routeParams.riderType,
    date = props.date || routeParams.date,
    startingPoint = props.startingPoint || routeParams.startingPoint,
    endingPoint = props.endingPoint || routeParams.endingPoint,
    participants = props.participants || routeParams.participants,
    description = props.description || routeParams.description,
    token = props.token || routeParams.token,
    distance = props.distance || routeParams.distance,
    username = props.username || routeParams.username,
    stopPoints = props.stopPoints || routeParams.stopPoints,
    currentUsername = props.currentUsername || routeParams.currentUsername,
    isRideStarted = props.active || routeParams.active || true,


  } = props;



  const [state, setState] = useState({
    mapImage: null,
    startMapImage: null,
    endMapImage: null,
    rideNameImage: null,
    imageLoading: false,
    rideNameImageLoading: false,
    rideNameImageError: null,
    distanceState: distance || '--',
    showParticipantsModal: false,
    rideDetailsWithCoords: null, // Initialize as null
  });
  const { joinRide } = useJoinRide();

  const formatDate = (date) => {
    if (!date) {return 'Not specified';}
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {return date.toString();}
    const options = { month: 'long', day: '2-digit', year: 'numeric' };
    const datePart = d.toLocaleDateString('en-US', options);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${datePart} ${hours}:${minutes}${ampm}`;
  };

  const handleBack = () => {
    navigation.goBack();
  };



  const handleJoinRide = () => {
    if (!generatedRidesId || !token) {
      Alert.alert('Error', 'Missing ride information. Please try again.');
      return;
    }
    joinRide(generatedRidesId, token, () => {
      console.log('Successfully requested to join ride');
    });
  };

  const getRideTypeIcon = (type) => {
    switch (type) {
      case 'car':
        return 'car';
      case 'motor':
        return 'motorcycle';
      case 'bike':
        return 'bicycle';
      case 'cafe Racers':
        return 'rocket';
      default:
        return 'circle';
    }
  };
  const mapCoords = processRideCoordinates(state.rideDetailsWithCoords);

  const handleSwipeToMap = () => {
    // Use the full ride details with coordinates if available
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
        startedBy: currentUsername,
        // Pass coordinate objects, not string names
        startingPoint: rideDetails?.startingPoint || startingPoint,
        endingPoint: rideDetails?.endingPoint || endingPoint,
        stopPoints: rideDetails?.stopPoints || stopPoints || [],
        participants: participants || [],
        isActive: true,
      },
      token,
      username: currentUsername,
      fromRideStep4: true,
    });
  };


  useEffect(() => {
    const loadLocationImage = async () => {
      if (!locationName || !token) {
        return;
      }

      try {
        setState(prev => ({ ...prev, rideNameImageLoading: true, rideNameImageError: null }));
        const imageDataList = await getLocationImage(locationName, token);
        setState(prev => ({
          ...prev,
          rideNameImage: Array.isArray(imageDataList) ? imageDataList : [],
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          rideNameImageError: error.message || 'Failed to load location images',
        }));
      } finally {
        setState(prev => ({ ...prev, rideNameImageLoading: false }));
      }
    };

    loadLocationImage();
  }, [locationName, token]);

  useEffect(() => {
    const getMapImage = async () => {
      if (!generatedRidesId) {return;}

      try {
        setState(prev => ({ ...prev, imageLoading: true }));
        const imageUrl = await fetchRideMapImage(generatedRidesId, token);
        setState(prev => ({ ...prev, mapImage: imageUrl }));
      } catch (error) {
        if (error.response) {
          console.error('Response status:', error.response.status);
        }
      } finally {
        setState(prev => ({ ...prev, imageLoading: false }));
      }
    };

    getMapImage();
  }, [generatedRidesId, token]);

  useEffect(() => {
    if (!generatedRidesId || !token) {
      console.log('Missing required data for ride details:', { generatedRidesId, token });
      return;
    }

    setState(prev => ({ ...prev, imageLoading: true }));

    getRideDetails(generatedRidesId, token)
      .then(rideDetails => {


        setState(prev => ({
          ...prev,
          startMapImage: rideDetails.magImageStartingLocation || prev.startMapImage,
          endMapImage: rideDetails.magImageEndingLocation || prev.endMapImage,
          distanceState: typeof rideDetails.distance !== 'undefined' ? rideDetails.distance : 'N/A',
          isRideActive: rideDetails.isActive === true || rideDetails.status === 'active',
          rideDetailsWithCoords: rideDetails,
        }));
      })
      .catch(error => {
        console.error('=== Error fetching ride details ===');
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        } else {
          console.error('Error message:', error.message);
        }
      })
      .finally(() => {
        setState(prev => ({ ...prev, imageLoading: false }));
      });
  }, [generatedRidesId, token]);


  const getLocationDisplayName = (location) => {
    if (typeof location === 'string') {
      return location;
    }
    if (location && typeof location === 'object') {
      return location.name || location.address || 'Location';
    }
    return 'Not specified';
  };

  return (
    <View style={modernRideStyles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" translucent={false} />

      {/* Modern Header */}
      <View style={modernRideStyles.modernHeader}>
        <TouchableOpacity style={modernRideStyles.modernBackButton} onPress={handleBack}>
          <FontAwesome name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>

        <View style={modernRideStyles.modernHeaderCenter}>
          <Text style={modernRideStyles.modernHeaderTitle} numberOfLines={1}>
            {locationName}
          </Text>
          <Text style={modernRideStyles.modernHeaderSubtitle}>
            ID: {generatedRidesId}
          </Text>
        </View>

        <View style={modernRideStyles.modernHeaderRight}>
          {username !== currentUsername ? (
            <TouchableOpacity style={modernRideStyles.modernJoinButton} onPress={handleJoinRide}>
              <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={modernRideStyles.modernJoinButtonText}>Join</Text>
            </TouchableOpacity>
          ) : (
            // Update the Start button in RideStep4.jsx

            <TouchableOpacity
              style={modernRideStyles.modernStartButton}
              onPress={async () => {
                try {
                  await startService.startRide(generatedRidesId, token);

                  // Pass complete ride data with coordinates
                  const rideDetails = state.rideDetailsWithCoords;
                  console.log('rideDetails:', rideDetails);

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
                      startedBy: currentUsername,
                      startingPoint: mapCoords.startingPoint,
                      endingPoint: mapCoords.endingPoint,
                      stopPoints: mapCoords.stopPoints,
                      startingPointName: mapCoords.startingPoint?.name || getLocationDisplayName(startingPoint),
                      endingPointName: mapCoords.endingPoint?.name || getLocationDisplayName(endingPoint),
                      participants: participants || [],
                      mapImage: state.mapImage || null,
                      startMapImage: state.startMapImage || null,
                      endMapImage: state.endMapImage || null,
                      rideNameImage: state.rideNameImage || [],
                      imageLoading: state.imageLoading || false,
                    },
                    token,
                    username: currentUsername,
                  });

                } catch (error) {
                  Alert.alert('Error', error.message || 'Failed to start the ride.');
                }
              }}
            >
              <FontAwesome name="play" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={modernRideStyles.fadeContainer}>
        {/* Hero Card */}
        <View style={modernRideStyles.sectionContainer}>
          <View style={modernRideStyles.mapWrapper}>
            <RouteMapView
              generatedRidesId={generatedRidesId}
              token={token}
              startingPoint={mapCoords.startingPoint}
              endingPoint={mapCoords.endingPoint}
              stopPoints={mapCoords.stopPoints}
              style={{ flex: 1 }}
              isDark={true}
            />
          </View>
        </View>
        <ScrollView style={modernRideStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={modernRideStyles.heroCard}>
            <View style={modernRideStyles.heroCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={modernRideStyles.heroCardTitle}>{rideName}</Text>
                <Text style={modernRideStyles.infoCardValue} numberOfLines={2}>
                  {formatDate(date)}
                </Text>
                <View style={modernRideStyles.heroCardMeta}>

                  <FontAwesome name="user-circle" size={14} color="#8c2323" />
                  <Text style={modernRideStyles.heroCardMetaText}>{String(username || '').toUpperCase()}</Text>
                </View>

              </View>
              <View style={modernRideStyles.rideTypeBadge}>
                <FontAwesome name={getRideTypeIcon(riderType)} size={20} color="#fff" />
                <Text style={modernRideStyles.infoCardValue}>{distance} km</Text>
              </View>
            </View>

            {description && (
              <View style={modernRideStyles.descriptionCard}>
                <Text style={[modernRideStyles.routePointLabel, { marginLeft: 8 }]}>Description</Text>
                <Text style={modernRideStyles.descriptionCardText}>{description}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'column', width: '100%', alignItems: 'flex-start' }}>
              <View style={[modernRideStyles.infoCard, { width: '100%', marginBottom: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[modernRideStyles.routePointLabel, { marginLeft: 8 }]}>From</Text>
                </View>
                <Text style={modernRideStyles.routePointText}>
                  {getLocationDisplayName(state.rideDetailsWithCoords?.startingPoint || startingPoint)}
                </Text>
              </View>

              <View style={[modernRideStyles.infoCard, { width: '100%' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[modernRideStyles.routePointLabel, { marginLeft: 8 }]}>To</Text>
                </View>
                <Text style={modernRideStyles.routePointText}>
                  {getLocationDisplayName(state.rideDetailsWithCoords?.endingPoint || endingPoint)}
                </Text>
              </View>
            </View>
          </View>

          <View style={modernRideStyles.modernBottomNav}>
            <TouchableOpacity
              style={modernRideStyles.modernBottomNavButton}
              onPress={() => setState(prev => ({ ...prev, showParticipantsModal: true }))}
            >
              <FontAwesome name="users" size={18} color="#fff" />
              <Text style={modernRideStyles.modernBottomNavText}>Riders</Text>
            </TouchableOpacity>

            <View style={modernRideStyles.modernBottomNavDivider} />

            {(isRideStarted) && (
              <>
                <View style={modernRideStyles.modernBottomNavDivider} />
                <TouchableOpacity
                  style={[modernRideStyles.modernBottomNavButton, { backgroundColor: 'rgba(140, 35, 35, 0.15)' }]}
                  onPress={handleSwipeToMap}
                >
                  <FontAwesome name="map" size={18} color="#8c2323" />
                  <Text style={[modernRideStyles.modernBottomNavText, { color: '#8c2323' }]}>Map View</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={modernRideStyles.modernBottomNavButton}
              onPress={() => navigation.navigate('RideRoutesPage', {
                startMapImage: state.startMapImage,
                endMapImage: state.endMapImage,
                mapImage: state.mapImage,
                rideNameImage: state.rideNameImage,
                startingPoint,
                endingPoint,
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
              })}
            >
              <FontAwesome name="map-marker" size={18} color="#fff" />
              <Text style={modernRideStyles.modernBottomNavText}>Stop Point</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>

      {/* Modern Bottom Navigation */}

      {/* Modals */}
      <ParticipantListModal
        visible={state.showParticipantsModal}
        onClose={() => setState(prev => ({ ...prev, showParticipantsModal: false }))}
        participants={participants}
        generatedRidesId={generatedRidesId}
        token={token}
        onRideSelect={(ride) => {
          setState(prev => ({ ...prev, showParticipantsModal: false }));
        }}
        username={username}
        currentUsername={currentUsername}
      />
    </View>
  );
};

export default RideStep4;