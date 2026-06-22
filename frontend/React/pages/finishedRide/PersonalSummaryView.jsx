// PersonalSummaryView.jsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {getPersonalSummary} from '../../services/startService';
import finishedRideStyles from '../../styles/screens/finishedRideStyles';
import colors from '../../styles/tokens/colors';
import FinishedRideSummary from './FinishedRideSummary';
import FinishedRideCheckpoints from './FinishedRideCheckpoints';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {finishedRideService} from '../../services/finishedRideService';

const PersonalSummaryView = ({route, navigation}) => {
  const {
    finishedRideData: passedData,
    generatedRidesId,
    username,
    // Callers (StartedRide, RideStep4, FinishedRideView) all pass `snapshotUri`.
    // The old key was `snapshotUrl` (no 'i'), which caused passedSnapshotUrl to
    // always be undefined — Bug 2 in the snapshot flow diagnosis.
    snapshotUri: passedSnapshotUrl,
  } = route.params || {};

  const [snapshotUrl, setSnapshotUrl] = useState(passedSnapshotUrl || null);
  // Bug 3 fix: was logging `setSnapshotUrl.length` (always 1 — the setter
  // function's parameter count) instead of `snapshotUrl.length` (the value).
  console.log(
    '[PersonalSummary] snapshotUri received:',
    passedSnapshotUrl
      ? 'YES (length: ' + passedSnapshotUrl.length + ')'
      : 'NULL/UNDEFINED',
  );
  const [rideData, setRideData] = useState(passedData || null);
  const [loading, setLoading] = useState(!passedData && !!generatedRidesId);
  const [error, setError] = useState(null);

  const insets = useSafeAreaInsets();

  // ── Fetch ride data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (passedData || !generatedRidesId) return;
    const load = async () => {
      try {
        const data = await getPersonalSummary(generatedRidesId);
        setRideData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [generatedRidesId]);


  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={finishedRideStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // ── Error / no data ──────────────────────────────────────────────────────
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
            {error ||
              'Your Personal Summary will be available after the ride is completed.'}
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
  const safeStopPoints = safeArr(rideData.stopPoints).map(s => ({
    lat: s.lat ?? s.stopLatitude,
    lng: s.lng ?? s.stopLongitude,
    name: s.name ?? s.stopName,
  }));

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={finishedRideStyles.container}>
      {/* ── Header ── */}
      <View style={[finishedRideStyles.header, {paddingTop: insets.top + 5}]}>
        <TouchableOpacity
          style={finishedRideStyles.backButtonSmall}
          onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={finishedRideStyles.headerTitle}>My Summary</Text>
        <TouchableOpacity
          style={finishedRideStyles.headerActionButton}
          onPress={() =>
            navigation.navigate('RideDetailView', {generatedRidesId})
          }>
          <FontAwesome name="bar-chart" size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ── Personal badge ── */}
        <View style={localStyles.personalBadge}>
          <FontAwesome name="user" size={12} color={colors.primary} />
          <Text style={finishedRideStyles.personalBadgeText}>
            Your personal checkpoint records
          </Text>
        </View>

        {/* ── Ride stats ── */}
        <FinishedRideSummary rideData={rideData} />

        {/* ── Checkpoint timeline ── */}
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

const localStyles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 48,
  },
  personalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mapWrapper: {
    height: 220,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  mapInner: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default PersonalSummaryView;
