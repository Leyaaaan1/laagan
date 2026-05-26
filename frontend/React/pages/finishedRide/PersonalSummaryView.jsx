// File: frontend/React/pages/FinishedRide/PersonalSummaryView.jsx

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
import {getPersonalSummary} from '../../services/startService';
import finishedRideStyles from '../../styles/screens/finishedRideStyles';
import colors from '../../styles/tokens/colors';
import FinishedRideSummary from './FinishedRideSummary';
import FinishedRideCheckpoints from './FinishedRideCheckpoints';

const PersonalSummaryView = ({route, navigation}) => {
  const {finishedRideData: passedData, generatedRidesId} = route.params || {};

  const [rideData, setRideData] = useState(passedData || null);
  const [loading, setLoading] = useState(!passedData && !!generatedRidesId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (passedData || !generatedRidesId) return;
    getPersonalSummary(generatedRidesId)
      .then(data => setRideData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
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
        {/* Personal badge */}
        <View style={finishedRideStyles.personalBadge}>
          <FontAwesome name="user" size={12} color={colors.primary} />
          <Text style={finishedRideStyles.personalBadgeText}>
            Your personal checkpoint records
          </Text>
        </View>

        {/* Summary hero card */}
        <FinishedRideSummary rideData={rideData} />

        {/* Personal checkpoint timeline */}
        <FinishedRideCheckpoints
          checkpointArrivals={safeArrivals}
          startingPointName={rideData.startingPointName}
          endingPointName={rideData.endingPointName}
          stopPoints={safeStopPoints}
        />

        {/* Done / Home button */}
        <TouchableOpacity
          style={finishedRideStyles.doneButton}
          onPress={() => navigation.navigate('RiderPage')}>
          <FontAwesome name="home" size={16} color={colors.white} />
          <Text style={finishedRideStyles.doneButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PersonalSummaryView;
