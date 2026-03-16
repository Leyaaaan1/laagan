// components/ride/RideSwipeContainer.jsx
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, ActivityIndicator } from 'react-native';
import PagerView from 'react-native-pager-view';
import StartedRide from '../pages/StartedRide';
import RideStep4 from '../components/ride/RideStep4';
import {processRideCoordinates} from '../utilities/route/CoordinateUtils';
import {getRideDetails} from '../services/rideService';

const { width } = Dimensions.get('window');

const RideSwipeContainer = ({ route, navigation }) => {
  const pagerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [rideDetailsWithCoords, setRideDetailsWithCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { params } = route;
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
    activeRide,
    mapImage,
    startMapImage,
    endMapImage,
    rideNameImage,
  } = params || {};

  useEffect(() => {
    const fetchRideCoordinates = async () => {
      if (!generatedRidesId || !token) {
        setIsLoading(false);
        return;
      }

      try {

        const rideDetails = await getRideDetails(generatedRidesId, token);



        setRideDetailsWithCoords(rideDetails);
      } catch (error) {
        console.error('[RideSwipeContainer] Error fetching ride details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRideCoordinates();
  }, [generatedRidesId, token]);

  // Process coordinates - this creates the proper { lat, lng, name } format
  const mapCoords = processRideCoordinates(
    rideDetailsWithCoords || {
      startingPoint,
      endingPoint,
      stopPoints,
    }
  );
  const getLocationDisplayName = (location) => {
    if (typeof location === 'string') return location;
    if (location && typeof location === 'object') {
      return location.name || location.address || 'Location';
    }
    return 'Not specified';
  };

  const unifiedRideData = {
    generatedRidesId,
    id: generatedRidesId,
    rideName,
    locationName,
    riderType,
    date,
    description,
    distance,
    username,
    startedBy: currentUsername,
    currentUsername,
    token,
    // CRITICAL: Pass coordinate OBJECTS, not strings
    startingPoint: mapCoords.startingPoint,
    endingPoint: mapCoords.endingPoint,
    stopPoints: mapCoords.stopPoints,
    // Also include display names
    startingPointName: mapCoords.startingPoint?.name || getLocationDisplayName(startingPoint),
    endingPointName: mapCoords.endingPoint?.name || getLocationDisplayName(endingPoint),
    // Other data
    participants: participants || [],
    mapImage: mapImage || null,
    startMapImage: startMapImage || null,
    endMapImage: endMapImage || null,
    rideNameImage: rideNameImage || [],
  };

  const handlePageSelected = (e) => {
    setCurrentPage(e.nativeEvent.position);
  };

  const goToPage = (pageNumber) => {
    pagerRef.current?.setPage(pageNumber);
  };

  // Show loading while fetching coordinates
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8c2323" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading ride details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {/* Page 0: Map View (StartedRide) */}
        <View key="0" style={styles.page}>
          <StartedRide
            route={{
              params: {
                activeRide: unifiedRideData,
                token,
                username: currentUsername,
              }
            }}
            navigation={navigation}
            onSwipeLeft={() => goToPage(1)}
          />
        </View>

        {/* Page 1: Ride Details (RideStep4) */}
        <View key="1" style={styles.page}>
          <RideStep4
            {...unifiedRideData}
            route={{ params: unifiedRideData }}
            navigation={navigation}
            onSwipeRight={() => goToPage(0)}
            hideStartButton={true}
          />
        </View>
      </PagerView>

      {/* Page Indicators */}
      <View style={styles.indicatorContainer}>
        <View style={[styles.indicator, currentPage === 0 && styles.activeIndicator]} />
        <View style={[styles.indicator, currentPage === 1 && styles.activeIndicator]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    width: width,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 24,
  },
});

export default RideSwipeContainer;