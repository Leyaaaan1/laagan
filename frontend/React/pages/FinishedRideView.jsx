// File: frontend/React/pages/FinishedRideView.jsx

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../styles/tokens/colors';
import finishedRideStyles from '../styles/screens/finishedRideStyles';
import {finishedRideService} from '../services/finishedRideService';
import FinishedRideSummary from './finishedRide/FinishedRideSummary';
import FinishedRideParticipants from './finishedRide/FinishedRideParticipants';
import FinishedRideCheckpoints from './finishedRide/FinishedRideCheckpoints';

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Given the raw checkpointArrivals array and stopPoints,
 * compute how many distinct checkpoints exist and how many
 * each rider reached.
 *
 * Total checkpoints = START (1) + stopPoints.length + ENDING (1)
 * We count by unique (type, index) combinations per rider.
 */
const enrichParticipants = (
  participants = [],
  checkpointArrivals = [],
  stopPoints = [],
) => {
  const totalCheckpoints = 1 + stopPoints.length + 1; // START + stops + ENDING

  return participants.map(p => {
    const reached = checkpointArrivals.filter(
      a => a.riderUsername === p.username,
    ).length;
    return {
      ...p,
      checkpointsReached: reached,
      totalCheckpoints,
    };
  });
};

// ─── Component ──────────────────────────────────────────────────

const FinishedRideView = ({route, navigation}) => {
  const {finishedRideData: passedData, generatedRidesId} = route.params || {};
  const [finishedRideData, setFinishedRideData] = useState(passedData || null);
  const [loading, setLoading] = useState(!passedData && !!generatedRidesId);

  useEffect(() => {
    if (passedData || !generatedRidesId) return;
    finishedRideService
      .getCompletionStatus(generatedRidesId)
      .then(data => setFinishedRideData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={finishedRideStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!finishedRideData) {
    return (
      <SafeAreaView style={finishedRideStyles.container}>
        <View style={finishedRideStyles.errorContainer}>
          <FontAwesome
            name="exclamation-circle"
            size={36}
            color={colors.error}
          />
          <Text style={finishedRideStyles.errorText}>
            No ride data available
          </Text>
          <TouchableOpacity
            style={finishedRideStyles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={finishedRideStyles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const {
    participantCount,
    completedParticipants = [],
    checkpointArrivals = [],
    startingPointName,
    endingPointName,
    stopPoints = [],
  } = finishedRideData;

  // ── Fix: derive real checkpoint counts from arrivals ──────────
  const enrichedParticipants = enrichParticipants(
    completedParticipants,
    checkpointArrivals,
    stopPoints,
  );

  return (
    <SafeAreaView style={finishedRideStyles.container}>
      <ScrollView contentContainerStyle={finishedRideStyles.scrollContent}>
        {/* Header */}
        <View style={finishedRideStyles.header}>
          <TouchableOpacity
            style={finishedRideStyles.backButtonSmall}
            onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={finishedRideStyles.headerTitle}>Ride Completed</Text>
          <View style={{width: 40}} />
        </View>

        {/* Summary */}
        <FinishedRideSummary
          rideData={finishedRideData}
          startingPointName={startingPointName}
          endingPointName={endingPointName}
        />

        {/* Participants */}
        <FinishedRideParticipants
          participants={enrichedParticipants}
          participantCount={participantCount}
        />

        {/* Checkpoints */}
        <FinishedRideCheckpoints
          checkpointArrivals={checkpointArrivals}
          startingPointName={startingPointName}
          endingPointName={endingPointName}
          stopPoints={stopPoints}
        />

        {/* Done Button */}
        <TouchableOpacity
          style={finishedRideStyles.doneButton}
          onPress={() => navigation.navigate('RiderPage')}>
          <FontAwesome name="home" size={18} color={colors.white} />
          <Text style={finishedRideStyles.doneButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FinishedRideView;
