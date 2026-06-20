
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {finishedRideService} from '../../../services/finishedRideService';
import colors from '../../../styles/tokens/colors';
import finishedRideStyles from '../../../styles/screens/finishedRideStyles';
import rideDetailStyles from '../../../styles/screens/rideDetailStyles';

import RideDetailHero from './RideDetailHero';
import RideDetailStats from './RideDetailStats';
import RideDetailSpeedChart from './RideDetailSpeedChart';




const RideDetailView = ({route, navigation}) => {
  const {generatedRidesId} = route.params ?? {};
  const insets = useSafeAreaInsets();

  const [rideDetail, setRideDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
        if (!isRefresh) {setLoading(true);}
        const data = await finishedRideService.getRideDetail(generatedRidesId);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail(true);
  };



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

  return (
    <SafeAreaView style={finishedRideStyles.container}>
      {/* ── Floating back button (overlays the hero) ───────────────────── */}
      <View
        style={[rideDetailStyles.viewFloatingHeader, {top: insets.top + 2}]}>
        <TouchableOpacity
          style={[
            finishedRideStyles.backButtonSmall,
            rideDetailStyles.viewFloatingBackBtn,
            rideDetailStyles.viewFloatingBackBtnPosition,
          ]}
          onPress={() => navigation.goBack()}>
          <FontAwesome
            name="arrow-left"
            size={16}
            color={photo?.imageUrl ? colors.white : colors.primary}
          />
        </TouchableOpacity>
        <View style={rideDetailStyles.viewPrBadgeWrap}>
          <View style={rideDetailStyles.viewPrBadgeInner}>
            <Text style={rideDetailStyles.viewPrBadgeOverlayText}>
              Your personal record
            </Text>
          </View>
        </View>
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
        <RideDetailHero photo={photo} rideName={rideName} />

        {/* ── Stat cards ──────────────────────────────────────────────── */}
        <RideDetailStats
          distanceMeters={distanceMeters}
          durationMinutes={durationMinutes}
          averageSpeedKph={averageSpeedKph}
          segmentCount={speedSegments.length}
          startTime={startTime}
          endTime={endTime}
        />

        {/* ── Speed chart ─────────────────────────────────────────────── */}
        {hasSegments && (
          <View style={rideDetailStyles.viewChartSection}>
            <RideDetailSpeedChart
              segments={speedSegments}
              averageSpeedKph={averageSpeedKph}
            />
          </View>
        )}


      </ScrollView>

      {/* ── Media upload sheet ──────────────────────────────────────────── */}

    </SafeAreaView>
  );
};

export default RideDetailView;
