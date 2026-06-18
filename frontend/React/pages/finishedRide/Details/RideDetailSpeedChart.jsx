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
import {View, Text, TouchableOpacity, LayoutAnimation} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../../styles/tokens/colors';
import rideDetailStyles from '../../../styles/screens/rideDetailStyles';

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
    <View
      style={[
        rideDetailStyles.chartSegmentWrap,
        isLast && rideDetailStyles.chartSegmentLast,
      ]}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={toggle}
        style={rideDetailStyles.chartSegmentRow}>
        {/* leg labels */}
        <View style={rideDetailStyles.chartLabels}>
          <Text style={rideDetailStyles.chartFromLabel} numberOfLines={1}>
            {segment.fromLabel ?? 'Start'}
          </Text>
          <View style={rideDetailStyles.chartToRow}>
            <FontAwesome
              name="arrow-right"
              size={9}
              color={colors.textMuted}
              style={rideDetailStyles.chartToArrowIcon}
            />
            <Text style={rideDetailStyles.chartToLabel} numberOfLines={1}>
              {segment.toLabel ?? 'End'}
            </Text>
          </View>
        </View>

        {/* bar track */}
        <View style={rideDetailStyles.chartTrack}>
          <View
            style={[
              rideDetailStyles.chartBar,
              {width: `${barW}%`, backgroundColor: color},
            ]}
          />
        </View>

        {/* speed badge */}
        <View
          style={[rideDetailStyles.chartBadge, {borderColor: color + '55'}]}>
          <Text style={[rideDetailStyles.chartBadgeValue, {color}]}>
            {speed > 0 ? speed.toFixed(1) : '—'}
          </Text>
          <Text style={rideDetailStyles.chartBadgeUnit}>kph</Text>
        </View>

        <FontAwesome
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={10}
          color={colors.textMuted}
          style={rideDetailStyles.chartChevron}
        />
      </TouchableOpacity>

      {/* expanded detail */}
      {expanded && (
        <View style={rideDetailStyles.chartDetail}>
          <View style={rideDetailStyles.chartDetailItem}>
            <Text style={rideDetailStyles.chartDetailLabel}>Distance</Text>
            <Text style={rideDetailStyles.chartDetailValue}>
              {fmtDist(segment.distanceMeters)}
            </Text>
          </View>
          <View style={rideDetailStyles.chartDetailDivider} />
          <View style={rideDetailStyles.chartDetailItem}>
            <Text style={rideDetailStyles.chartDetailLabel}>Duration</Text>
            <Text style={rideDetailStyles.chartDetailValue}>
              {fmtDur(segment.durationMinutes)}
            </Text>
          </View>
          <View style={rideDetailStyles.chartDetailDivider} />
          <View style={rideDetailStyles.chartDetailItem}>
            <Text style={rideDetailStyles.chartDetailLabel}>vs avg</Text>
            <Text
              style={[
                rideDetailStyles.chartDetailValue,
                {color: barColor(speed, avgSpeed)},
              ]}>
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
    <View style={rideDetailStyles.chartSection}>
      {/* section header */}
      <View style={rideDetailStyles.chartSectionHeader}>
        <View style={rideDetailStyles.chartSectionIconWrap}>
          <FontAwesome name="bar-chart" size={13} color={colors.primary} />
        </View>
        <Text style={rideDetailStyles.chartSectionTitle}>Speed by Segment</Text>
        <View style={rideDetailStyles.chartAvgBadge}>
          <Text style={rideDetailStyles.chartAvgBadgeText}>
            avg {(averageSpeedKph ?? 0).toFixed(1)} kph
          </Text>
        </View>
      </View>

      {/* legend */}
      <View style={rideDetailStyles.chartLegend}>
        {[
          {color: '#10b981', label: '≥115% avg'},
          {color: '#4285f4', label: 'On pace'},
          {color: '#f59e0b', label: 'Below avg'},
          {color: colors.primary, label: 'Slow leg'},
        ].map(({color, label}) => (
          <View key={label} style={rideDetailStyles.chartLegendItem}>
            <View
              style={[
                rideDetailStyles.chartLegendDot,
                {backgroundColor: color},
              ]}
            />
            <Text style={rideDetailStyles.chartLegendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* bars */}
      <View style={rideDetailStyles.chartContainer}>
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

      <Text style={rideDetailStyles.chartHint}>Tap a segment for details</Text>
    </View>
  );
};

export default RideDetailSpeedChart;
