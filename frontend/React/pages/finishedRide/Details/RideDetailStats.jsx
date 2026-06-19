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
import {View, Text} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../../styles/tokens/colors';
import rideDetailStyles from '../../../styles/screens/rideDetailStyles';

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
  <View
    style={[
      rideDetailStyles.statsCard,
      wide && rideDetailStyles.statsCardWide,
    ]}>
    <View
      style={[
        rideDetailStyles.statsIconWrap,
        {backgroundColor: iconColor + '22'},
      ]}>
      <FontAwesome name={icon} size={14} color={iconColor} />
    </View>
    <Text style={rideDetailStyles.statsLabel}>{label}</Text>
    <View style={rideDetailStyles.statsValueRow}>
      <Text style={rideDetailStyles.statsValue}>{value}</Text>
      {!!unit && <Text style={rideDetailStyles.statsUnit}> {unit}</Text>}
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
    <View style={rideDetailStyles.statsSection}>
      <View style={rideDetailStyles.statsRow}>
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

      <View style={rideDetailStyles.statsRow}>
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
        <View style={rideDetailStyles.statsTimeRow}>
          <View style={rideDetailStyles.statsTimeItem}>
            <Text style={rideDetailStyles.statsTimeLabel}>Started</Text>
            <Text style={rideDetailStyles.statsTimeValue}>
              {fmtTime(startTime)}
            </Text>
          </View>
          <FontAwesome
            name="long-arrow-right"
            size={14}
            color={colors.textSecondary}
            style={rideDetailStyles.statsArrow}
          />
          <View
            style={[
              rideDetailStyles.statsTimeItem,
              rideDetailStyles.statsTimeItemRight,
            ]}>
            <Text style={rideDetailStyles.statsTimeLabel}>Finished</Text>
            <Text style={rideDetailStyles.statsTimeValue}>
              {fmtTime(endTime)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default RideDetailStats;
