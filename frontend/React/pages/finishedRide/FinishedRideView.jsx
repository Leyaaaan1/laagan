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
import colors from '../../styles/tokens/colors';
import finishedRideStyles from '../../styles/screens/finishedRideStyles';
import {
  getCheckpointArrivals,
  getFinishedRideSummary,
  getPersonalSummary,
  getRideStatus,
} from '../../services/startService';
import FinishedRideSummary from './FinishedRideSummary';
import FinishedRideParticipants from './FinishedRideParticipants';
import FinishedRideCheckpoints from './FinishedRideCheckpoints';

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
  const {
    finishedRideData: passedData,
    generatedRidesId,
    isRideActive,
    isPersonalSummary,
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

  // FIX: wrap load() in useEffect so it only runs once on mount,
  // not on every render. The original code called load() directly
  // in the render body, causing an infinite re-render + request loop.
  useEffect(() => {
    if (passedData || !generatedRidesId) return;

    const load = async () => {
      try {
        const statusData = await getRideStatus(generatedRidesId);

        if (isPersonalSummary) {
          const data = await getPersonalSummary(generatedRidesId);
          setFinishedRideData(data);
          return;
        }

        if (statusData.currentStatus === 'FINISHED') {
          const data = await getFinishedRideSummary(generatedRidesId);
          setFinishedRideData(data);
          return;
        }

        // Still active — load live arrivals
        const arrivals = await getCheckpointArrivals(generatedRidesId);
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [generatedRidesId]); // only re-run if the ride ID changes

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
            size={40}
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

  const headerTitle = isPersonalSummary
    ? 'My Summary'
    : isRideActive && !passedData
    ? 'Live Arrivals'
    : 'Ride Summary';

  return (
    <SafeAreaView style={finishedRideStyles.container}>
      {/* Header */}
      <View style={finishedRideStyles.header}>
        <TouchableOpacity
          style={finishedRideStyles.backButtonSmall}
          onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={16} color={colors.primary} />
        </TouchableOpacity>

        <Text style={finishedRideStyles.headerTitle}>{headerTitle}</Text>

        {!isPersonalSummary && generatedRidesId ? (
          <TouchableOpacity
            style={finishedRideStyles.headerActionButton}
            onPress={() =>
              navigation.navigate('PersonalSummaryView', {generatedRidesId})
            }>
            <FontAwesome name="user" size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{width: 36}} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={finishedRideStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <FinishedRideSummary rideData={finishedRideData} />

        {!isPersonalSummary && (
          <FinishedRideParticipants
            participants={enrichedParticipants}
            participantCount={participantCount}
          />
        )}

        <FinishedRideCheckpoints
          checkpointArrivals={safeArrivals}
          startingPointName={startingPointName}
          endingPointName={endingPointName}
          stopPoints={safeStopPoints}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default FinishedRideView;
