// File: frontend/React/pages/FinishedRide/FinishedRideParticipants.jsx

import React from 'react';
import {View, Text} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../styles/tokens/colors';
import finishedRideStyles from '../../styles/screens/finishedRideStyles';

const formatArrivalTime = iso => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
};

const FinishedRideParticipants = ({participants, participantCount}) => {
  const hasParticipants = participants && participants.length > 0;

  return (
    <View style={finishedRideStyles.section}>
      {/* Section header */}
      <View style={finishedRideStyles.sectionHeader}>
        <Text style={finishedRideStyles.sectionTitle}>Participants</Text>
        {participantCount > 0 && (
          <View style={finishedRideStyles.sectionBadge}>
            <Text style={finishedRideStyles.sectionBadgeText}>
              {participantCount}
            </Text>
          </View>
        )}
      </View>

      {hasParticipants ? (
        <View style={finishedRideStyles.participantsList}>
          {participants.map((participant, idx) => {
            const pct =
              participant.totalCheckpoints > 0
                ? Math.round(
                    (participant.checkpointsReached /
                      participant.totalCheckpoints) *
                      100,
                  )
                : 0;
            // Prefer backend `status` when present (finished-ride path),
            // fall back to percentage-based completion (live-arrivals path,
            // where status hasn't been computed yet).
            const isComplete = participant.status
              ? participant.status === 'COMPLETED'
              : pct === 100;
            const isLast = idx === participants.length - 1;
            const arrivalLabel = formatArrivalTime(participant.arrivalTime);

            return (
              <View
                key={participant.username ?? `participant-${idx}`}
                style={[
                  finishedRideStyles.participantItem,
                  isLast && finishedRideStyles.participantItemLast,
                ]}>
                {/* Avatar */}
                <View style={finishedRideStyles.participantAvatar}>
                  <Text style={finishedRideStyles.participantInitial}>
                    {(participant.username || 'U')[0].toUpperCase()}
                  </Text>
                </View>

                {/* Info */}
                <View style={finishedRideStyles.participantInfo}>
                  <Text style={finishedRideStyles.participantName}>
                    {participant.username}
                  </Text>
                  <Text style={finishedRideStyles.participantCheckpoints}>
                    {participant.checkpointsReached} /{' '}
                    {participant.totalCheckpoints} checkpoints
                    {arrivalLabel ? `  ·  ${arrivalLabel}` : ''}
                  </Text>
                </View>

                {/* Completion badge */}
                <View
                  style={[
                    finishedRideStyles.completionBadge,
                    isComplete && finishedRideStyles.completionBadgeFull,
                  ]}>
                  {isComplete ? (
                    <FontAwesome name="check" size={12} color="#4CAF50" />
                  ) : null}
                  <Text
                    style={[
                      finishedRideStyles.completionPercent,
                      isComplete && finishedRideStyles.completionPercentFull,
                    ]}>
                    {pct}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={finishedRideStyles.emptyContainer}>
          <View style={finishedRideStyles.emptyIconWrap}>
            <FontAwesome name="users" size={22} color={colors.textSecondary} />
          </View>
          <Text style={finishedRideStyles.emptyText}>No participants</Text>
        </View>
      )}
    </View>
  );
};

export default FinishedRideParticipants;
