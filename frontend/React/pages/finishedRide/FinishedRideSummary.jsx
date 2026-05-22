
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
      second: '2-digit',
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

  return (
    <View style={finishedRideStyles.summaryCard}>
      <Text style={finishedRideStyles.rideName}>{rideData.rideName}</Text>

      <View style={finishedRideStyles.summaryRow}>
        <View style={finishedRideStyles.summaryItem}>
          <FontAwesome name="clock-o" size={16} color={colors.primary} />
          <Text style={finishedRideStyles.summaryLabel}>Duration</Text>
          <Text style={finishedRideStyles.summaryValue}>
            {rideData.durationMinutes ?? '—'}{' '}
            {rideData.durationMinutes ? 'min' : ''}
          </Text>
        </View>

        <View style={finishedRideStyles.summaryItem}>
          <FontAwesome name="road" size={16} color={colors.primary} />
          <Text style={finishedRideStyles.summaryLabel}>Distance</Text>
          <Text style={finishedRideStyles.summaryValue}>
            {rideData.distance ?? '—'} {rideData.distance ? 'km' : ''}
          </Text>
        </View>

        <View style={finishedRideStyles.summaryItem}>
          <FontAwesome name="bicycle" size={16} color={colors.primary} />
          <Text style={finishedRideStyles.summaryLabel}>Type</Text>
          <Text style={finishedRideStyles.summaryValue}>
            {rideData.riderType ?? '—'}
          </Text>
        </View>
      </View>

      <View style={finishedRideStyles.divider} />

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

        <FontAwesome
          name="arrow-right"
          size={16}
          color={colors.textSecondary}
          style={{marginHorizontal: spacing.md}}
        />

        <View style={finishedRideStyles.timeItem}>
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
  );
};

export default FinishedRideSummary;
