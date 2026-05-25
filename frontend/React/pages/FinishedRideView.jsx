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
import {
  getCheckpointArrivals,
  getFinishedRideSummary,
} from '../services/startService';
import FinishedRideSummary from './finishedRide/FinishedRideSummary';
import FinishedRideParticipants from './finishedRide/FinishedRideParticipants';
import FinishedRideCheckpoints from './finishedRide/FinishedRideCheckpoints';

// ─── Helpers ────────────────────────────────────────────────────

const enrichParticipants = (
  participants = [],
  checkpointArrivals = [],
  stopPoints = [],
) => {
  const totalCheckpoints = 1 + stopPoints.length + 1;
  return participants.map(p => {
    const reached = checkpointArrivals.filter(
      a => a.riderUsername === p.username,
    ).length;
    return {...p, checkpointsReached: reached, totalCheckpoints};
  });
};

const safe = val => (Array.isArray(val) ? val : []);

// ─── Component ──────────────────────────────────────────────────

const FinishedRideView = ({route, navigation}) => {
  // Two ways to arrive here:
  // 1. finishedRideData  — full data object passed directly (owner just finished)
  // 2. generatedRidesId  — only the ID passed, we fetch based on isRideActive flag
  //    isRideActive: true  → ride still ongoing, fetch live checkpoint arrivals
  //    isRideActive: false → ride done, fetch full finished summary from DB
  const {
    finishedRideData: passedData,
    generatedRidesId,
    isRideActive,
    // context passed so we can display ride info even on live view
    rideName,
    startingPointName: passedStartingPointName,
    endingPointName: passedEndingPointName,
    stopPoints: passedStopPoints,
    participantCount: passedParticipantCount,
    participants: passedParticipants,
    startTime: passedStartTime,
  } = route.params || {};

  const [finishedRideData, setFinishedRideData] = useState(passedData || null);
  const [loading, setLoading] = useState(!passedData && !!generatedRidesId);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If full data was passed directly (owner finished ride), nothing to fetch
    if (passedData || !generatedRidesId) return;

    if (isRideActive) {
      // Ride still active — fetch live checkpoint arrivals only
      getCheckpointArrivals(generatedRidesId)
        .then(arrivals => {
          // Build a data shape compatible with the view using passed context
          setFinishedRideData({
            rideName,
            startingPointName: passedStartingPointName,
            endingPointName: passedEndingPointName,
            stopPoints: passedStopPoints || [],
            participantCount: passedParticipantCount,
            startTime: passedStartTime,
            checkpointArrivals: arrivals,
            completedParticipants: (passedParticipants || []).map(p => ({
              username: typeof p === 'string' ? p : p.username,
            })),
          });
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      // Ride finished — fetch full summary from DB
      getFinishedRideSummary(generatedRidesId)
        .then(data => setFinishedRideData(data))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, []);

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={finishedRideStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // ── Error / no data ───────────────────────────────────────────
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
            {error || 'No ride data available'}
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

  // ── Render ────────────────────────────────────────────────────
  const {
    participantCount,
    completedParticipants,
    checkpointArrivals,
    startingPointName,
    endingPointName,
    stopPoints,
  } = finishedRideData;

  const safeParticipants = safe(completedParticipants);
  const safeArrivals = safe(checkpointArrivals);
  const safeStopPoints = safe(stopPoints);

  const enrichedParticipants = enrichParticipants(
    safeParticipants,
    safeArrivals,
    safeStopPoints,
  );

  const headerTitle =
    isRideActive && !passedData ? 'Live Checkpoint Arrivals' : 'Ride Completed';

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
          <Text style={finishedRideStyles.headerTitle}>{headerTitle}</Text>
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
          checkpointArrivals={safeArrivals}
          startingPointName={startingPointName}
          endingPointName={endingPointName}
          stopPoints={safeStopPoints}
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
