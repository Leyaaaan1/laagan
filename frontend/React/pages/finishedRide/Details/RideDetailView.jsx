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
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {finishedRideService} from '../../../services/finishedRideService';
import colors from '../../../styles/tokens/colors';
import spacing from '../../../styles/tokens/spacing';
import {fontSize, fontWeight} from '../../../styles/tokens/typography';
import finishedRideStyles from '../../../styles/screens/finishedRideStyles';

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
  <View style={localStyles.sectionHeader}>
    <View style={localStyles.sectionIconWrap}>
      <FontAwesome name={icon} size={13} color={colors.primary} />
    </View>
    <Text style={localStyles.sectionTitle}>{title}</Text>
    {badge != null && (
      <View style={localStyles.sectionBadge}>
        <Text style={localStyles.sectionBadgeText}>{badge}</Text>
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
          style={{flex: 1}}
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
        style={[localStyles.floatingHeader, {top: insets.top + spacing.sm}]}>
        <TouchableOpacity
          style={[
            finishedRideStyles.backButtonSmall,
            localStyles.floatingBackBtn,
          ]}
          onPress={() => navigation.goBack()}>
          <FontAwesome
            name="arrow-left"
            size={16}
            color={rideDetail?.photo?.imageUrl ? colors.white : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: spacing.xl * 2}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }>
        {/* ── Hero: cover photo + inline stats overlay ──────────────── */}
        <RideDetailHero
          photo={photo}
          rideName={rideName}
          distanceKm={distanceKm}
          durationMin={durationMinutes}
          avgSpeedKph={averageSpeedKph}
          onUpload={() => setUploadVisible(true)}
        />

        {/* personal-record badge */}
        {hasPersonalRecord && (
          <View style={localStyles.prBadge}>
            <FontAwesome name="trophy" size={11} color={colors.primary} />
            <Text style={localStyles.prBadgeText}>Your personal record</Text>
          </View>
        )}

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
          <View style={localStyles.section}>
            <SectionHeader icon="map-o" title="Route" />
            <View style={localStyles.mapWrapper}>
              <RouteMapView
                generatedRidesId={generatedRidesId}
                startingPoint={mapCoords.startingPoint}
                endingPoint={mapCoords.endingPoint}
                stopPoints={mapCoords.stopPoints ?? []}
                isDark={false}
                style={{flex: 1}}
              />
            </View>
            {/* start / end labels */}
            <View style={localStyles.routeLabels}>
              <View style={localStyles.routeLabel}>
                <View
                  style={[localStyles.routeDot, {backgroundColor: '#10b981'}]}
                />
                <Text style={localStyles.routeLabelText} numberOfLines={1}>
                  {startingPointName ?? 'Start'}
                </Text>
              </View>
              <View style={localStyles.routeLabel}>
                <View
                  style={[
                    localStyles.routeDot,
                    {backgroundColor: colors.primary},
                  ]}
                />
                <Text style={localStyles.routeLabelText} numberOfLines={1}>
                  {endingPointName ?? 'End'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Speed chart ───────────────────────────────────────────── */}
        {speedSegments.length > 0 && (
          <View style={localStyles.chartSection}>
            <RideDetailSpeedChart
              segments={speedSegments}
              averageSpeedKph={averageSpeedKph}
            />
          </View>
        )}

        {/* ── Photo caption ─────────────────────────────────────────── */}
        {photo?.caption ? (
          <View style={localStyles.section}>
            <SectionHeader icon="quote-left" title="Caption" />
            <View style={localStyles.captionCard}>
              <Text style={localStyles.captionText}>{photo.caption}</Text>
              <Text style={localStyles.captionMeta}>
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
            style={localStyles.addMediaCta}
            onPress={() => setUploadVisible(true)}
            activeOpacity={0.8}>
            <FontAwesome name="camera" size={16} color={colors.primary} />
            <Text style={localStyles.addMediaCtaText}>
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

// ─────────────────────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  // ── floating back button overlaps hero ───────
  floatingHeader: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 10,
  },
  floatingBackBtn: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20,
    padding: 6,
  },

  // ── personal record badge ─────────────────────
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
    backgroundColor: colors.primaryAlpha10,
  },
  prBadgeText: {
    fontSize: fontSize.sm,
    color: colors.tibetanRed200,
    fontWeight: fontWeight.semi,
  },

  // ── section wrapper ───────────────────────────
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryAlpha15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionBadge: {
    backgroundColor: colors.primaryAlpha15,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
  },
  sectionBadgeText: {
    fontSize: fontSize.xs,
    color: colors.tibetanRed200,
    fontWeight: fontWeight.bold,
  },

  // ── map ───────────────────────────────────────
  mapWrapper: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  routeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  routeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '47%',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLabelText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },

  // ── speed chart section margin ────────────────
  chartSection: {
    marginTop: spacing.md,
  },

  // ── caption card ──────────────────────────────
  captionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  captionText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  captionMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // ── add media CTA ─────────────────────────────
  addMediaCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addMediaCtaText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
});

export default RideDetailView;
