/**
 * RideDetailView.jsx
 *
 * Strava-style personal ride detail screen.
 * Fetches RideDetailDTO from GET /view/{generatedRidesId}/detail and
 * assembles the full-bleed hero, stat cards, speed chart, route map,
 * and media upload flow.
 *
 * Navigation params expected:
 *   generatedRidesId – string (required)
 *   username         – string (optional, for display context)
 */
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
import RideDetailMediaUpload from './RideDetailMediaUpload';
import {
  isValidCoordinate,
  processRideCoordinates,
} from '../../../utilities/CoordinateUtils';
import RouteMapView from '../../../utilities/route/view/RouteMapView';

// ─────────────────────────────────────────────────────────────────────────────

const SectionHeader = ({icon, title, badge}) => (
  <View style={rideDetailStyles.viewSectionHeader}>
    <View style={rideDetailStyles.viewSectionIconWrap}>
      <FontAwesome name={icon} size={13} color={colors.primary} />
    </View>
    <Text style={rideDetailStyles.viewSectionTitle}>{title}</Text>
    {badge != null && (
      <View style={rideDetailStyles.viewSectionBadge}>
        <Text style={rideDetailStyles.viewSectionBadgeText}>{badge}</Text>
      </View>
    )}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────

const RideDetailView = ({route, navigation}) => {
  const {generatedRidesId, username} = route.params ?? {};
  const insets = useSafeAreaInsets();

  const [rideDetail, setRideDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [uploadVisible, setUploadVisible] = useState(false);
  const NOT_YET_AVAILABLE_MESSAGE =
    "You haven't finished this ride yet — your detail view will appear once you do.";
  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchDetail = useCallback(
    async (isRefresh = false) => {
      if (!generatedRidesId) {
        setError('The graph will be available after the ride is completed');
        setLoading(false);
        return;
      }
      try {
        if (!isRefresh) setLoading(true);
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

  // ── Upload callbacks ─────────────────────────────────────────────────────
  const handlePhotoUploaded = updatedPhoto => {
    setRideDetail(prev => ({...prev, photo: updatedPhoto}));
  };

  // ── Loading ──────────────────────────────────────────────────────────────
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

  // ── Derived values ───────────────────────────────────────────────────────
  const {
    rideName,
    distanceMeters,
    durationMinutes,
    averageSpeedKph,
    startTime,
    endTime,
    speedSegments = [],
    photo,
    hasPersonalRecord,
    startingPointName,
    endingPointName,
    stopPoints = [],
  } = rideDetail;

  const distanceKm = distanceMeters != null ? distanceMeters / 1000 : null;
  const mapCoords = processRideCoordinates(rideDetail);
  const hasRoute = isValidCoordinate(mapCoords?.startingPoint);

  return (
    <SafeAreaView style={finishedRideStyles.container}>
      {/* ── Floating back button (overlays the hero) ──────────────────── */}
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
            color={rideDetail?.photo?.imageUrl ? colors.white : colors.primary}
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
        <RideDetailHero
          photo={photo}
          rideName={rideName}
          distanceKm={distanceKm}
          durationMin={durationMinutes}
          avgSpeedKph={averageSpeedKph}
          onUpload={() => setUploadVisible(true)}
        />

        {/* ── Stat cards ────────────────────────────────────────────── */}
        <RideDetailStats
          distanceMeters={distanceMeters}
          durationMinutes={durationMinutes}
          averageSpeedKph={averageSpeedKph}
          segmentCount={speedSegments.length}
          startTime={startTime}
          endTime={endTime}
        />

        {/* ── Route map ─────────────────────────────────────────────── */}
        {hasRoute && (
          <View style={rideDetailStyles.viewSection}>
            <SectionHeader icon="map-o" title="Route" />
            <View style={rideDetailStyles.viewMapWrapper}>
              <RouteMapView
                generatedRidesId={generatedRidesId}
                startingPoint={mapCoords.startingPoint}
                endingPoint={mapCoords.endingPoint}
                stopPoints={mapCoords.stopPoints ?? []}
                isDark={false}
                style={rideDetailStyles.viewRouteMapFill}
              />
            </View>
            {/* start / end labels */}
            <View style={rideDetailStyles.viewRouteLabels}>
              <View style={rideDetailStyles.viewRouteLabel}>
                <View
                  style={[
                    rideDetailStyles.viewRouteDot,
                    {backgroundColor: '#10b981'},
                  ]}
                />
                <Text
                  style={rideDetailStyles.viewRouteLabelText}
                  numberOfLines={1}>
                  {startingPointName ?? 'Start'}
                </Text>
              </View>
              <View style={rideDetailStyles.viewRouteLabel}>
                <View
                  style={[
                    rideDetailStyles.viewRouteDot,
                    {backgroundColor: colors.primary},
                  ]}
                />
                <Text
                  style={rideDetailStyles.viewRouteLabelText}
                  numberOfLines={1}>
                  {endingPointName ?? 'End'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Speed chart ───────────────────────────────────────────── */}
        {speedSegments.length > 0 && (
          <View style={rideDetailStyles.viewChartSection}>
            <RideDetailSpeedChart
              segments={speedSegments}
              averageSpeedKph={averageSpeedKph}
            />
          </View>
        )}

        {/* ── Photo caption ─────────────────────────────────────────── */}
        {photo?.caption ? (
          <View style={rideDetailStyles.viewSection}>
            <SectionHeader icon="quote-left" title="Caption" />
            <View style={rideDetailStyles.viewCaptionCard}>
              <Text style={rideDetailStyles.viewCaptionText}>
                {photo.caption}
              </Text>
              <Text style={rideDetailStyles.viewCaptionMeta}>
                {photo.uploadedBy ?? username ?? '—'}
                {photo.uploadedAt
                  ? ` · ${new Date(photo.uploadedAt).toLocaleDateString()}`
                  : ''}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── Add media CTA (if no photo yet) ──────────────────────── */}
        {!photo && (
          <TouchableOpacity
            style={rideDetailStyles.viewAddMediaCta}
            onPress={() => setUploadVisible(true)}
            activeOpacity={0.8}>
            <FontAwesome name="camera" size={16} color={colors.primary} />
            <Text style={rideDetailStyles.viewAddMediaCtaText}>
              Add a photo or video to this ride
            </Text>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </ScrollView>
      {/* ── Media upload sheet ────────────────────────────────────────── */}
      <RideDetailMediaUpload
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onPhotoUploaded={handlePhotoUploaded}
        onVideoUploaded={() => {}}
        generatedRidesId={generatedRidesId}
      />
    </SafeAreaView>
  );
};

export default RideDetailView;
