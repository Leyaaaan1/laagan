/**
 * RideDetailSpeedChart.jsx
 *
 * Horizontal bar chart for speed segments (SpeedSegmentDTO[]).
 * Pure View-based — no external charting library required.
 *
 * Each bar is colored on a green → amber → red gradient based on
 * how the leg's speed compares to the ride average, so the rider
 * can immediately see where they pushed hardest.
 *
 * Props:
 *   segments        – SpeedSegmentDTO[]
 *   averageSpeedKph – number | null   (used as baseline for coloring)
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../../styles/tokens/colors';
import spacing from '../../../styles/tokens/spacing';
import {fontSize, fontWeight} from '../../../styles/tokens/typography';

/** Map segment speed vs average to a color */
const barColor = (segKph, avgKph) => {
  if (!avgKph || !segKph) return colors.borderLight;
  const ratio = segKph / avgKph;
  if (ratio >= 1.15) return '#10b981'; // well above avg → green
  if (ratio >= 0.92) return '#4285f4'; // near avg → blue
  if (ratio >= 0.75) return '#f59e0b'; // below avg → amber
  return colors.primary; // well below → brand red
};

const fmtDist = m => {
  if (m == null) return '—';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
};

const fmtDur = min => {
  if (min == null) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const SegmentRow = ({segment, maxSpeed, avgSpeed, isLast}) => {
  const [expanded, setExpanded] = useState(false);
  const speed = segment.averageSpeedKph ?? 0;
  const barW = maxSpeed > 0 ? Math.max((speed / maxSpeed) * 100, 4) : 0;
  const color = barColor(speed, avgSpeed);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(v => !v);
  };

  return (
    <View style={[styles.segmentWrap, isLast && styles.segmentLast]}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={toggle}
        style={styles.segmentRow}>
        {/* leg labels */}
        <View style={styles.labels}>
          <Text style={styles.fromLabel} numberOfLines={1}>
            {segment.fromLabel ?? 'Start'}
          </Text>
          <View style={styles.toRow}>
            <FontAwesome
              name="arrow-right"
              size={9}
              color={colors.textMuted}
              style={{marginRight: 4}}
            />
            <Text style={styles.toLabel} numberOfLines={1}>
              {segment.toLabel ?? 'End'}
            </Text>
          </View>
        </View>

        {/* bar track */}
        <View style={styles.track}>
          <View
            style={[styles.bar, {width: `${barW}%`, backgroundColor: color}]}
          />
        </View>

        {/* speed badge */}
        <View style={[styles.badge, {borderColor: color + '55'}]}>
          <Text style={[styles.badgeValue, {color}]}>
            {speed > 0 ? speed.toFixed(1) : '—'}
          </Text>
          <Text style={styles.badgeUnit}>kph</Text>
        </View>

        <FontAwesome
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={10}
          color={colors.textMuted}
          style={styles.chevron}
        />
      </TouchableOpacity>

      {/* expanded detail */}
      {expanded && (
        <View style={styles.detail}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>
              {fmtDist(segment.distanceMeters)}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {fmtDur(segment.durationMinutes)}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>vs avg</Text>
            <Text
              style={[styles.detailValue, {color: barColor(speed, avgSpeed)}]}>
              {avgSpeed
                ? `${speed >= avgSpeed ? '+' : ''}${(speed - avgSpeed).toFixed(
                    1,
                  )} kph`
                : '—'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const RideDetailSpeedChart = ({segments = [], averageSpeedKph}) => {
  if (!segments.length) return null;

  const maxSpeed = Math.max(...segments.map(s => s.averageSpeedKph ?? 0), 0.1);

  return (
    <View style={styles.section}>
      {/* section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <FontAwesome name="bar-chart" size={13} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>Speed by Segment</Text>
        <View style={styles.avgBadge}>
          <Text style={styles.avgBadgeText}>
            avg {(averageSpeedKph ?? 0).toFixed(1)} kph
          </Text>
        </View>
      </View>

      {/* legend */}
      <View style={styles.legend}>
        {[
          {color: '#10b981', label: '≥115% avg'},
          {color: '#4285f4', label: 'On pace'},
          {color: '#f59e0b', label: 'Below avg'},
          {color: colors.primary, label: 'Slow leg'},
        ].map(({color, label}) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: color}]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* bars */}
      <View style={styles.chartContainer}>
        {segments.map((seg, i) => (
          <SegmentRow
            key={`${seg.fromLabel}-${i}`}
            segment={seg}
            maxSpeed={maxSpeed}
            avgSpeed={averageSpeedKph}
            isLast={i === segments.length - 1}
          />
        ))}
      </View>

      <Text style={styles.hint}>Tap a segment for details</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },

  // ── section header ───────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
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
  avgBadge: {
    backgroundColor: colors.primaryAlpha15,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  avgBadgeText: {
    fontSize: fontSize.xs,
    color: colors.tibetanRed200,
    fontWeight: fontWeight.semi,
  },

  // ── legend ────────────────────────────────────
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // ── chart container ──────────────────────────
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },

  // ── segment row ───────────────────────────────
  segmentWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  segmentLast: {
    borderBottomWidth: 0,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  labels: {
    width: 90,
  },
  fromLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: colors.textPrimary,
  },
  toRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  toLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    flex: 1,
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  badge: {
    alignItems: 'center',
    width: 46,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  badgeUnit: {
    fontSize: 9,
    color: colors.textMuted,
  },
  chevron: {
    width: 14,
    textAlign: 'center',
  },

  // ── expanded detail ───────────────────────────
  detail: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 2,
  },
  detailLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },

  hint: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default RideDetailSpeedChart;
