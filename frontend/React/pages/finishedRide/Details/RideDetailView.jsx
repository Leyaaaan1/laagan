import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { finishedRideService } from '../../../services/finishedRideService';
import colors from '../../../styles/tokens/colors';
import finishedRideStyles from '../../../styles/screens/finishedRideStyles';
import rideDetailStyles from '../../../styles/screens/rideDetailStyles';

import ShareCardButton from '../card/ShareCardButton';
import RideDetailStats from './RideDetailStats';
import RideDetailSpeedChart from './RideDetailSpeedChart';

import FinishedRideSummary from '../FinishedRideSummary';
import FinishedRideParticipants from '../FinishedRideParticipants';
import FinishedRideCheckpoints from '../FinishedRideCheckpoints';
import {
  getFinishedRideSummary,
  getPersonalSummary,
} from '../../../services/startService';
import checkpointModalStyles from '../../../styles/screens/checkpointModalStyles';

const safe = val => (Array.isArray(val) ? val : []);

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
    return { ...p, checkpointsReached: reached, totalCheckpoints };
  });
};

const RideDetailView = ({ route, navigation }) => {
  const { generatedRidesId } = route.params ?? {};

  const insets = useSafeAreaInsets();

  const [rideDetail, setRideDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('My Stats'); // 'finished' | 'detail' | 'personal'

  const [finishedData, setFinishedData] = useState(null);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [finishedError, setFinishedError] = useState(null);

  const [personalData, setPersonalData] = useState(null);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalError, setPersonalError] = useState(null);

  const [snapshotUrl, setSnapshotUrl] = useState(null);

  const NOT_YET_AVAILABLE_MESSAGE =
    "You haven't finished this ride yet — your detail view will appear once you do.";

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDetail = useCallback(
    async (isRefresh = false) => {
      if (!generatedRidesId) {
        setError('The graph will be available after the ride is completed');
        setLoading(false);
        return;
      }
      try {
        if (!isRefresh) {
          setLoading(true);
        }
        const data = await getPersonalSummary(generatedRidesId); //
        setRideDetail(data);
        setError(null);
      } catch (err) {
        setError(
          err.message === 'NOT_YET_AVAILABLE'
            ? NOT_YET_AVAILABLE_MESSAGE
            : err.message ?? 'Failed to load ride',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [generatedRidesId],
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (snapshotUrl || !generatedRidesId) return;
    finishedRideService
      .getPersonalSnapshot(generatedRidesId)
      .then(url => setSnapshotUrl(url))
      .catch(() => {
        // No snapshot uploaded for this ride yet — screen just renders without it
      });
  }, [generatedRidesId, snapshotUrl]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail(true);
  };

  const handleTabPress = useCallback(
    async tab => {
      setActiveTab(tab);

      if (tab === 'Ride Summary' && !finishedData && !finishedLoading) {
        setFinishedLoading(true);
        setFinishedError(null);
        try {
          const data = await getFinishedRideSummary(generatedRidesId);
          console.log('🔵 finishedData:', JSON.stringify(data, null, 2)); // ← ADD

          setFinishedData(data);
        } catch (err) {
          setFinishedError(err.message ?? 'Failed to load finished summary');
        } finally {
          setFinishedLoading(false);
        }
        return;
      }

      if (tab === 'My Summary' && !personalData && !personalLoading) {
        setPersonalLoading(true);
        setPersonalError(null);
        try {
          const data = await getPersonalSummary(generatedRidesId);
          setPersonalData(data);
        } catch (err) {
          setPersonalError(err.message ?? 'Failed to load personal summary');
        } finally {
          setPersonalLoading(false);
        }
      }
    },
    [
      generatedRidesId,
      finishedData,
      finishedLoading,
      personalData,
      personalLoading,
    ],
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={finishedRideStyles.container}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={rideDetailStyles.viewLoadingIndicator}
        />
      </SafeAreaView>
    );
  }

  if (!rideDetail) {
    const isNotYetAvailable = error === NOT_YET_AVAILABLE_MESSAGE;
    return (
      <SafeAreaView style={finishedRideStyles.container}>
        <View style={finishedRideStyles.errorContainer}>
          <FontAwesome
            name={isNotYetAvailable ? 'clock-o' : 'exclamation-circle'}
            size={40}
            color={isNotYetAvailable ? colors.textMuted : colors.error}
          />
          <Text style={finishedRideStyles.errorText}>
            {error ?? 'No ride data available'}
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

  // ── Derived values ─────────────────────────────────────────────────────────
  const {
    rideName,
    distanceMeters,
    durationMinutes,
    averageSpeedKph,
    startTime,
    endTime,
    speedSegments = [],
    photo,
  } = rideDetail;

  const hasSegments = speedSegments.length > 0;

  const finishedArrivals = safe(finishedData?.checkpointArrivals);
  const finishedStopPoints = safe(finishedData?.stopPoints);
  const finishedParticipantProgress = safe(finishedData?.participantProgress);
  const enrichedParticipants = finishedParticipantProgress.length
    ? finishedParticipantProgress
    : enrichParticipants(
      safe(finishedData?.completedParticipants),
      finishedArrivals,
      finishedStopPoints,
    );

  const personalArrivals = safe(personalData?.checkpointArrivals);
  const personalStopPoints = safe(personalData?.stopPoints).map(s => ({
    lat: s.lat ?? s.stopLatitude,
    lng: s.lng ?? s.stopLongitude,
    name: s.name ?? s.stopName,
  }));

  const shareData = {
    ...rideDetail, // All DTO fields from getPersonalSummary
    snapshotUrl: snapshotUrl ?? null, // Only add the snapshot separately
  };

  return (
    <SafeAreaView style={finishedRideStyles.container}>
      {/* ── Floating back button (overlays the hero) ───────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + 2,
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}>
        <TouchableOpacity
          style={finishedRideStyles.backButtonSmall}
          onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={16} color={colors.primary} />
        </TouchableOpacity>
        <View style={rideDetailStyles.viewPrBadgeWrap}></View>
        <View style={{width: 36}} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={rideDetailStyles.viewScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }>
        {/* ── Hero (photo + ride name only) ───────────────────────────── */}

        {/* ── Stat cards ──────────────────────────────────────────────── */}
        {activeTab === 'My Stats' && (
          <>
            {/* ── Stat cards ──────────────────────────────────────────── */}
            {snapshotUrl && (
              <View style={localStyles.snapshotWrapper}>
                <Image
                  source={{uri: snapshotUrl}}
                  style={localStyles.snapshotImage}
                  resizeMode="contain"
                />
              </View>
            )}
            {hasSegments && (
              <View style={rideDetailStyles.viewChartSection}>
                <RideDetailSpeedChart
                  segments={speedSegments}
                  averageSpeedKph={averageSpeedKph}
                />
              </View>
            )}
            <RideDetailStats
              distanceMeters={distanceMeters}
              durationMinutes={durationMinutes}
              averageSpeedKph={averageSpeedKph}
              segmentCount={speedSegments.length}
              startTime={startTime}
              endTime={endTime}
            />

            <ShareCardButton
              shareData={shareData}
              format="story"
              initialPhotoUri={snapshotUrl}
            />
          </>
        )}

        {activeTab === 'Ride Summary' && (
          <>
            {finishedLoading && (
              <ActivityIndicator size="large" color={colors.primary} />
            )}
            {!finishedLoading && finishedError && (
              <Text style={finishedRideStyles.errorText}>{finishedError}</Text>
            )}
            {!finishedLoading && !finishedError && finishedData && (
              <>
                <FinishedRideSummary rideData={finishedData} />
                <FinishedRideParticipants
                  participants={enrichedParticipants}
                  participantCount={finishedData.participantCount}
                />
                <FinishedRideCheckpoints
                  checkpointArrivals={finishedArrivals}
                  startingPointName={finishedData.startingPointName}
                  endingPointName={finishedData.endingPointName}
                  stopPoints={finishedStopPoints}
                />
              </>
            )}
          </>
        )}

        {activeTab === 'My Summary' && (
          <>
            {personalLoading && (
              <ActivityIndicator size="large" color={colors.primary} />
            )}
            {!personalLoading && personalError && (
              <Text style={finishedRideStyles.errorText}>{personalError}</Text>
            )}
            {!personalLoading && !personalError && personalData && (
              <>
                <FinishedRideSummary rideData={personalData} />
                <FinishedRideCheckpoints
                  checkpointArrivals={personalArrivals}
                  startingPointName={personalData.startingPointName}
                  endingPointName={personalData.endingPointName}
                  stopPoints={personalStopPoints}
                />
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Tab switcher ──────────────────────────────────────────────── */}
      <View style={checkpointModalStyles.footer}>
        <View style={checkpointModalStyles.footerPill}>
          <TouchableOpacity
            style={[
              checkpointModalStyles.footerSegment,
              activeTab === 'Ride Summary' &&
                checkpointModalStyles.footerSegmentClose,
            ]}
            onPress={() => handleTabPress('Ride Summary')}>
            <Text style={checkpointModalStyles.footerSegmentText}>
              Ride Summary
            </Text>
          </TouchableOpacity>

          <View style={checkpointModalStyles.footerPillDivider} />

          <TouchableOpacity
            style={[
              checkpointModalStyles.footerSegment,
              activeTab === 'My Stats' &&
                checkpointModalStyles.footerSegmentClose,
            ]}
            onPress={() => handleTabPress('My Stats')}>
            <Text style={checkpointModalStyles.footerSegmentText}>
              My Stats
            </Text>
          </TouchableOpacity>

          <View style={checkpointModalStyles.footerPillDivider} />

          <TouchableOpacity
            style={[
              checkpointModalStyles.footerSegment,
              activeTab === 'My Summary' &&
                checkpointModalStyles.footerSegmentClose,
            ]}
            onPress={() => handleTabPress('My Summary')}>
            <Text style={checkpointModalStyles.footerSegmentText}>
              My Summary
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  snapshotWrapper: {
    height: 220,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)', // ← subtle fill for the gaps
  },
  snapshotImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default RideDetailView;
