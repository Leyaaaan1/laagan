import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { fetchRideMapImage, getRideDetails, getLocationImage } from '../../services/rideService';
import ParticipantListModal from './modal/ParticipantListModal';
import useJoinRide from './util/RideHandler';
import { startService } from '../../services/startService';
import RouteMapView from '../../utilities/route/view/RouteMapView';
import { processRideCoordinates } from '../../utilities/CoordinateUtils';
import cards from '../../styles/base/cards';
import buttons from '../../styles/base/buttons';
import header from '../../styles/base/header';
import badges from '../../styles/base/badges';
import layout from '../../styles/base/layout';
import rideStep4Styles from '../../styles/screens/rideStep4';
import mapStyles from '../../styles/components/mapStyles';

const RideStep4 = (props) => {
  const navigation = useNavigation();
  // Support both direct props (from CreateRide step render) and
  // navigation route params (when navigated to as a screen).
  // Direct props always win over route params.
  const routeParams = props.route?.params || {};
  const merged = { ...routeParams, ...props };

  const {
    generatedRidesId,
    rideName,
    locationName,
    riderType,
    date,
    startingPoint,
    endingPoint,
    participants,
    description,
    token,
    distance,
    username,
    stopPoints,
    currentUsername,
    active: isRideStarted = true,
    rideDetailsWithCoords: passedRideDetails = null,
    skipCoordsFetch = false,
  } = merged;

  // ✅ Now safe — variables are defined above
  const hasFetchedRef = useRef(skipCoordsFetch && !!passedRideDetails);

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

  const { joinRide } = useJoinRide();

  const formatDate = (dateValue) => {
    if (!dateValue) { return 'Not specified'; }
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(d.getTime())) { return dateValue.toString(); }
    const options = { month: 'long', day: '2-digit', year: 'numeric' };
    const datePart = d.toLocaleDateString('en-US', options);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${datePart} ${hours}:${minutes}${ampm}`;
  };

  const getLocationDisplayName = (location) => {
    if (typeof location === 'string') { return location; }
    if (location && typeof location === 'object') {
      return location.name || location.address || 'Location';
    }
    return 'Not specified';
  };

  const handleBack = () => navigation.goBack();

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
      case 'car':         return 'car';
      case 'motor':       return 'motorcycle';
      case 'bike':        return 'bicycle';
      case 'cafe Racers': return 'rocket';
      default:            return 'circle';
    }
  };

  // Build coords for the map. Use rideDetailsWithCoords once loaded,
  // but fall back to the raw props passed in so markers show immediately
  // rather than waiting for the getRideDetails API call to complete.
  const rawFallbackCoords = {
    startingPoint: startingPoint
      ? (typeof startingPoint === 'string'
        ? { name: startingPoint, lat: parseFloat(merged.startLat) || 0, lng: parseFloat(merged.startLng) || 0 }
        : startingPoint)
      : null,
    endingPoint: endingPoint
      ? (typeof endingPoint === 'string'
        ? { name: endingPoint, lat: parseFloat(merged.endLat) || 0, lng: parseFloat(merged.endLng) || 0 }
        : endingPoint)
      : null,
    stopPoints: Array.isArray(stopPoints) ? stopPoints : [],
  };

  const mapCoords = processRideCoordinates(state.rideDetailsWithCoords) || rawFallbackCoords;

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
        startedBy: currentUsername,
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

  // Location image fetch
  useEffect(() => {
    if (!locationName || !token) { return; }
    const loadLocationImage = async () => {
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

  // Map thumbnail fetch
  useEffect(() => {
    if (!generatedRidesId) { return; }
    const getMapImage = async () => {
      try {
        setState(prev => ({ ...prev, imageLoading: true }));
        const imageUrl = await fetchRideMapImage(generatedRidesId, token);
        setState(prev => ({ ...prev, mapImage: imageUrl }));
      } catch (error) {
        console.error('Error fetching map image:', error?.response?.status || error.message);
      } finally {
        setState(prev => ({ ...prev, imageLoading: false }));
      }
    };
    getMapImage();
  }, [generatedRidesId, token]);

  // Ride details fetch — skipped if pre-fetched
  useEffect(() => {
    if (!generatedRidesId || !token) { return; }
    if (hasFetchedRef.current) { return; }

    setState(prev => ({ ...prev, imageLoading: true }));

    getRideDetails(generatedRidesId, token)
      .then(rideDetails => {
        setState(prev => ({
          ...prev,
          startMapImage: rideDetails.magImageStartingLocation || prev.startMapImage,
          endMapImage: rideDetails.magImageEndingLocation || prev.endMapImage,
          distanceState: rideDetails.distance ?? 'N/A',
          isRideActive: rideDetails.isActive === true || rideDetails.status === 'active',
          rideDetailsWithCoords: rideDetails,
        }));
      })
      .catch(error => {
        console.error('Error fetching ride details:', error?.response?.status || error.message);
      })
      .finally(() => {
        setState(prev => ({ ...prev, imageLoading: false }));
      });
  }, [generatedRidesId, token]);

  return (
    <View style={rideStep4Styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" translucent={false} />

      {/* Header */}
      <View style={header.bar}>
        <TouchableOpacity style={header.backButton} onPress={handleBack}>
          <FontAwesome name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        {/* ✅ center slot — not headers.bar */}
        <View style={header.center}>
          <Text style={header.title} numberOfLines={1}>
            {locationName}
          </Text>
          <Text style={header.subtitle}>
            ID: {generatedRidesId}
          </Text>
        </View>

        <View style={header.right}>
          {username !== currentUsername ? (
            <TouchableOpacity style={rideStep4Styles.joinButton} onPress={handleJoinRide}>
              <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={rideStep4Styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={rideStep4Styles.startButton}
              onPress={async () => {
                try {
                  await startService.startRide(generatedRidesId, token);
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

      {/* ✅ fadeContainer holds map + scroll — no triple-nested cards */}
      <View style={rideStep4Styles.fadeContainer}>

        {/* Map */}
        <View style={mapStyles.wrapper}>
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

        <ScrollView style={rideStep4Styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero card */}
          <View style={cards.hero}>
            <View style={cards.heroHeader}>
              <View style={{ flex: 1 }}>
                <Text style={cards.heroTitle}>{rideName}</Text>
                <Text style={cards.infoValue} numberOfLines={2}>
                  {formatDate(date)}
                </Text>
                <View style={cards.heroMeta}>
                  <FontAwesome name="user-circle" size={14} color="#8c2323" />
                  <Text style={cards.heroMetaText}>
                    {String(username || '').toUpperCase()}
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
                <Text style={[mapStyles.routePointLabel, { marginLeft: 8 }]}>Description</Text>
                <Text style={cards.descriptionText}>{description}</Text>
              </View>
            )}

            {/* From / To */}
            <View style={{ flexDirection: 'column', width: '100%', alignItems: 'flex-start' }}>
              <View style={[cards.info, { width: '100%', marginBottom: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[mapStyles.routePointLabel, { marginLeft: 8 }]}>From</Text>
                </View>
                <Text style={mapStyles.routePointText}>
                  {getLocationDisplayName(state.rideDetailsWithCoords?.startingPointName)}
                </Text>
              </View>

              <View style={[cards.info, { width: '100%' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[mapStyles.routePointLabel, { marginLeft: 8 }]}>To</Text>
                </View>
                <Text style={mapStyles.routePointText}>
                  {getLocationDisplayName(state.rideDetailsWithCoords?.endingPointName)}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Nav */}
          <View style={header.bottomNav}>
            <TouchableOpacity
              style={buttons.bottomNav}
              onPress={() => setState(prev => ({ ...prev, showParticipantsModal: true }))}
            >
              <FontAwesome name="users" size={18} color="#fff" />
              <Text style={buttons.textNav}>Riders</Text>
            </TouchableOpacity>

            <View style={header.bottomNavDivider} />

            {isRideStarted && (
              <>
                <View style={header.bottomNavDivider} />
                <TouchableOpacity
                  style={[buttons.bottomNav, { backgroundColor: 'rgba(140, 35, 35, 0.15)' }]}
                  onPress={handleSwipeToMap}
                >
                  <FontAwesome name="map" size={18} color="#8c2323" />
                  <Text style={[buttons.textNav, { color: '#8c2323' }]}>Map View</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={buttons.bottomNav}
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
              <Text style={buttons.textNav}>Stop Point</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>

      {/* Modals */}
      <ParticipantListModal
        visible={state.showParticipantsModal}
        onClose={() => setState(prev => ({ ...prev, showParticipantsModal: false }))}
        participants={participants}
        generatedRidesId={generatedRidesId}
        token={token}
        onRideSelect={() => setState(prev => ({ ...prev, showParticipantsModal: false }))}
        username={username}
        currentUsername={currentUsername}
      />
    </View>
  );
};

export default RideStep4;