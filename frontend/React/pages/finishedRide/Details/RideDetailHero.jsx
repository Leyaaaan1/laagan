/**
 *RideDetailHero.jsx
 *
 * Full-bleed cover photo/video with gradient overlay and ride name + key stat.
 * Mirrors Strava's activity header: image behind, stats on top.
 *
 * Props:
 *   photo       – PhotoDTO | null
 *   rideName    – string
 *   distanceKm  – number
 *   durationMin – number
 *   avgSpeedKph – number
 *   onUpload    – () => void  (called when the upload button is tapped)
 */
import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../../styles/tokens/colors';
import spacing from '../../../styles/tokens/spacing';
import {fontSize, fontWeight} from '../../../styles/tokens/typography';

const HERO_HEIGHT = 280;

const OverlayStat = ({icon, value, unit, label}) => (
  <View style={styles.overlayStat}>
    <FontAwesome
      name={icon}
      size={11}
      color={colors.tibetanRed200}
      style={styles.overlayStatIcon}
    />
    <Text style={styles.overlayStatValue}>
      {value}
      <Text style={styles.overlayStatUnit}> {unit}</Text>
    </Text>
    <Text style={styles.overlayStatLabel}>{label}</Text>
  </View>
);

const RideDetailHero = ({
  photo,
  rideName,
  distanceKm,
  durationMin,
  avgSpeedKph,
  onUpload,
}) => {
  const hasPhoto = !!photo?.imageUrl;
  const hours = Math.floor((durationMin ?? 0) / 60);
  const mins = (durationMin ?? 0) % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const HeroContent = () => (
    <View style={styles.heroInner}>
      {/* gradient sits on top of the image */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* upload CTA — top-right */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={onUpload}
        activeOpacity={0.8}>
        <FontAwesome
          name={hasPhoto ? 'camera' : 'plus'}
          size={13}
          color={colors.white}
        />
        <Text style={styles.uploadButtonText}>
          {hasPhoto ? 'Change' : 'Add photo'}
        </Text>
      </TouchableOpacity>

      {/* ride name */}
      <View style={styles.bottomOverlay}>
        <Text style={styles.rideName} numberOfLines={2}>
          {rideName ?? 'Unnamed Ride'}
        </Text>

        {/* inline stats strip */}
        <View style={styles.statsStrip}>
          <OverlayStat
            icon="road"
            value={(distanceKm ?? 0).toFixed(1)}
            unit="km"
            label="Distance"
          />
          <View style={styles.statDivider} />
          <OverlayStat
            icon="clock-o"
            value={durationStr}
            unit=""
            label="Duration"
          />
          <View style={styles.statDivider} />
          <OverlayStat
            icon="tachometer"
            value={(avgSpeedKph ?? 0).toFixed(1)}
            unit="kph"
            label="Avg speed"
          />
        </View>
      </View>
    </View>
  );

  if (hasPhoto) {
    return (
      <ImageBackground
        source={{uri: photo.imageUrl}}
        style={styles.hero}
        resizeMode="cover">
        <HeroContent />
      </ImageBackground>
    );
  }

  // No photo — plain dark hero so the overlay still looks intentional
  return (
    <View style={[styles.hero, styles.heroDark]}>
      <HeroContent />
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    height: HERO_HEIGHT,
    width: '100%',
  },
  heroDark: {
    backgroundColor: colors.surface,
  },
  heroInner: {
    flex: 1,
  },

  // ── upload button ────────────────────────────────
  uploadButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  uploadButtonText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.semi,
  },

  // ── bottom overlay ────────────────────────────────
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  rideName: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },

  // ── stats strip ───────────────────────────────────
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  overlayStat: {
    flex: 1,
    alignItems: 'center',
  },
  overlayStatIcon: {
    marginBottom: 3,
  },
  overlayStatValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  overlayStatUnit: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.tibetanRed200,
  },
  overlayStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});

export default RideDetailHero;
