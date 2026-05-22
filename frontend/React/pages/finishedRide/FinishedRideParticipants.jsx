// File: frontend/React/pages/FinishedRide/FinishedRideParticipants.jsx

import React from 'react';
import {View, Text} from 'react-native';
import colors from '../../styles/tokens/colors';
import finishedRideStyles from '../../styles/screens/finishedRideStyles';

const FinishedRideParticipants = ({participants, participantCount}) => {
  return (
    <View style={finishedRideStyles.section}>
      <Text style={finishedRideStyles.sectionTitle}>
        Participants ({participantCount})
      </Text>
      <View style={finishedRideStyles.participantsList}>
        {participants && participants.length > 0 ? (
          participants.map((participant, idx) => (
            <View
              key={`participant-${idx}`}
              style={finishedRideStyles.participantItem}>
              <View style={finishedRideStyles.participantAvatar}>
                <Text style={finishedRideStyles.participantInitial}>
                  {(participant.username || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={finishedRideStyles.participantInfo}>
                <Text style={finishedRideStyles.participantName}>
                  {participant.username}
                </Text>
                <Text style={finishedRideStyles.participantCheckpoints}>
                  {participant.checkpointsReached}/
                  {participant.totalCheckpoints} checkpoints
                </Text>
              </View>
              <View style={finishedRideStyles.completionBadge}>
                <Text style={finishedRideStyles.completionPercent}>
                  {Math.round(
                    (participant.checkpointsReached /
                      participant.totalCheckpoints) *
                      100,
                  )}
                  %
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={finishedRideStyles.noDataText}>No participants</Text>
        )}
      </View>
    </View>
  );
};

export default FinishedRideParticipants;
