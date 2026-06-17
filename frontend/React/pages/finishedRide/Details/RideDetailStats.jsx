/**
 * RideDetailStats.jsx
 *
 * 2×2 grid of glanceable stat cards.
 * Reads from RideDetailDTO fields; gracefully handles nulls.
 *
 * Props:
 *   distanceMeters  – number | null
 *   durationMinutes – number | null
 *   averageSpeedKph – number | null
 *   segmentCount    – number          (derived from speedSegments.length)
 *   startTime       – string | null   (ISO string)
 *   endTime         – string | null   (ISO string)
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../../styles/tokens/colors';
import spacing from '../../../styles/tokens/spacing';
import {fontSize, fontWeight} from '../../../styles/tokens/typography';

const fmt = (n, digits = 1) => (n == null ? '—' : Number(n).toFixed(digits));

const fmtDistance = meters => {
  if (meters == null) return {value: '—', unit: ''};
  const km = meters / 1000;
  return km >= 1
    ? {value: km.toFixed(2), unit: 'km'}
    : {value: String(meters), unit: 'm'};
};

const fmtDuration = minutes => {
  if (minutes == null) return {value: '—', unit: ''};
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return {value: `${h}h ${m}m`, unit: ''};
  return {value: String(m), unit: 'min'};
};

const fmtTime = isoStr => {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const StatCard = ({icon, iconColor, label, value, unit, wide}) => (
  <View style={[styles.card, wide && styles.cardWide]}>
    <View style={[styles.iconWrap, {backgroundColor: iconColor + '22'}]}>
      <FontAwesome name={icon} size={14} color={iconColor} />
    </View>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueRow}>
      <Text style={styles.value}>{value}</Text>
      {!!unit && <Text style={styles.unit}> {unit}</Text>}
    </View>
  </View>
);

const RideDetailStats = ({
  distanceMeters,
  durationMinutes,
  averageSpeedKph,
  segmentCount,
  startTime,
  endTime,
}) => {
  const dist = fmtDistance(distanceMeters);
  const dur = fmtDuration(durationMinutes);

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <StatCard
          icon="road"
          iconColor={colors.primary}
          label="Distance"
          value={dist.value}
          unit={dist.unit}
        />
        <StatCard
          icon="clock-o"
          iconColor="#4285f4"
          label="Duration"
          value={dur.value}
          unit={dur.unit}
        />
      </View>

      <View style={styles.row}>
        <StatCard
          icon="tachometer"
          iconColor="#10b981"
          label="Avg speed"
          value={fmt(averageSpeedKph)}
          unit="kph"
        />
        <StatCard
          icon="flag-checkered"
          iconColor="#f59e0b"
          label="Segments"
          value={segmentCount > 0 ? String(segmentCount) : '—'}
          unit={segmentCount > 0 ? 'legs' : ''}
        />
      </View>

      {/* Start / end time row */}
      {(startTime || endTime) && (
        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Started</Text>
            <Text style={styles.timeValue}>{fmtTime(startTime)}</Text>
          </View>
          <FontAwesome
            name="long-arrow-right"
            size={14}
            color={colors.textSecondary}
            style={styles.arrow}
          />
          <View style={[styles.timeItem, styles.timeItemRight]}>
            <Text style={styles.timeLabel}>Finished</Text>
            <Text style={styles.timeValue}>{fmtTime(endTime)}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  // ── stat card ─────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardWide: {
    flex: 2,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },

  // ── time strip ────────────────────────────────
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  timeItem: {
    flex: 1,
  },
  timeItemRight: {
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  timeValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  arrow: {
    paddingHorizontal: spacing.md,
  },
});

export default RideDetailStats;
