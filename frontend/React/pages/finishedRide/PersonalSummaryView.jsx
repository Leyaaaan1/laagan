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
import {getPersonalSummary, getRideStatus} from '../../services/startService';
import finishedRideStyles from '../../styles/screens/finishedRideStyles';
import colors from '../../styles/tokens/colors';
import FinishedRideSummary from './FinishedRideSummary';
import FinishedRideCheckpoints from './FinishedRideCheckpoints';

const PersonalSummaryView = ({route, navigation}) => {
  const {
    finishedRideData: passedData,
    generatedRidesId,
    username,
  } = route.params || {};

  const [rideData, setRideData] = useState(passedData || null);
  const [loading, setLoading] = useState(!passedData && !!generatedRidesId);
  const [error, setError] = useState(null);

  useEffect(() => {
    // FIX 1: guard against missing data before accessing passedData.u
    // FIX 2: load() was defined but the effect had no actual fetch call path —
    //         the console.log crashed when passedData was undefined
    if (passedData || !generatedRidesId) return;

    const load = async () => {
      try {
        // Only check riderStatus if we have a username to check against
        if (username) {
          const statusData = await getRideStatus(generatedRidesId);
          const riderDone = statusData.riderStatuses?.some(
            r => r.riderUsername === username && r.status === 'RIDER_FINISHED',
          );
          if (!riderDone && statusData.currentStatus !== 'FINISHED') {
            setError("You haven't completed this ride yet.");
            return;
          }
        }

        const data = await getPersonalSummary(generatedRidesId);
        setRideData(data);
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
  if (!rideData) {
    return (
      <SafeAreaView style={finishedRideStyles.container}>
        <View style={finishedRideStyles.errorContainer}>
          <FontAwesome
            name="exclamation-circle"
            size={40}
            color={colors.error}
          />
          <Text style={finishedRideStyles.errorText}>
            {error || 'No summary data available'}
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

  const safeArr = val => (Array.isArray(val) ? val : []);
  const safeArrivals = safeArr(rideData.checkpointArrivals);
  const safeStopPoints = safeArr(rideData.stopPoints);

  return (
    <SafeAreaView style={finishedRideStyles.container}>
      {/* Header */}
      <View style={finishedRideStyles.header}>
        <TouchableOpacity
          style={finishedRideStyles.backButtonSmall}
          onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={finishedRideStyles.headerTitle}>My Summary</Text>
        <View style={{width: 36}} />
      </View>

      <ScrollView
        contentContainerStyle={finishedRideStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={finishedRideStyles.personalBadge}>
          <FontAwesome name="user" size={12} color={colors.primary} />
          <Text style={finishedRideStyles.personalBadgeText}>
            Your personal checkpoint records
          </Text>
        </View>

        <FinishedRideSummary rideData={rideData} />

        <FinishedRideCheckpoints
          checkpointArrivals={safeArrivals}
          startingPointName={rideData.startingPointName}
          endingPointName={rideData.endingPointName}
          stopPoints={safeStopPoints}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

export default PersonalSummaryView;
