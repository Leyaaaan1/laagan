// File: frontend/React/pages/FinishedRide/FinishedRideSummary.jsx

import React from 'react';
import {View, Text} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../styles/tokens/colors';
import spacing from '../../styles/tokens/spacing';
import finishedRideStyles from '../../styles/screens/finishedRideStyles';

const FinishedRideSummary = ({rideData}) => {
  const formatTime = timestamp => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = timestamp => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const stats = [
    {
      icon: 'clock-o',
      label: 'Duration',
      value: rideData.durationMinutes ?? '—',
      unit: rideData.durationMinutes ? 'min' : '',
    },
    {
      icon: 'road',
      label: 'Distance',
      value: rideData.distance ?? '—',
      unit: rideData.distance ? 'km' : '',
    },
    {
      icon: 'bicycle',
      label: 'Type',
      value: rideData.riderType ?? '—',
      unit: '',
    },
  ];
  return (
    <View style={finishedRideStyles.heroCard}>
      {/* Top accent line */}
      <View style={finishedRideStyles.heroAccent} />

      <View style={finishedRideStyles.heroPadding}>

        {/* Stats row */}
        <View style={finishedRideStyles.statsRow}>
          {stats.map((stat, idx) => (
            <View key={idx} style={finishedRideStyles.statItem}>
              <View style={finishedRideStyles.statIconWrap}>
                <FontAwesome
                  name={stat.icon}
                  size={14}
                  color={colors.primary}
                />
              </View>
              <Text style={finishedRideStyles.statLabel}>{stat.label}</Text>
              <Text style={finishedRideStyles.statValue}>{stat.value}</Text>
              {!!stat.unit && (
                <Text style={finishedRideStyles.statUnit}>{stat.unit}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={finishedRideStyles.divider} />

        {/* Start → End time row */}
        <View style={finishedRideStyles.timeRow}>
          <View style={finishedRideStyles.timeItem}>
            <Text style={finishedRideStyles.timeLabel}>Started</Text>
            <Text style={finishedRideStyles.timeValue}>
              {formatTime(rideData.startTime)}
            </Text>
            <Text style={finishedRideStyles.timeDate}>
              {formatDate(rideData.startTime)}
            </Text>
          </View>

          <View style={finishedRideStyles.timeArrow}>
            <FontAwesome
              name="long-arrow-right"
              size={18}
              color={colors.white}
            />
          </View>

          <View style={[finishedRideStyles.timeItem, {alignItems: 'flex-end'}]}>
            <Text style={finishedRideStyles.timeLabel}>Ended</Text>
            <Text style={finishedRideStyles.timeValue}>
              {formatTime(rideData.endTime)}
            </Text>
            <Text style={finishedRideStyles.timeDate}>
              {formatDate(rideData.endTime)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default FinishedRideSummary;
