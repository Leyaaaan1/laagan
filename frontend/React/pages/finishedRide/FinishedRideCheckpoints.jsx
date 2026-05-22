// File: frontend/React/pages/FinishedRide/FinishedRideCheckpoints.jsx

import React from 'react';
import {View, Text} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../styles/tokens/colors';
import finishedRideStyles from '../../styles/screens/finishedRideStyles';

const FinishedRideCheckpoints = ({
  checkpointArrivals,
  startingPointName,
  endingPointName,
  stopPoints,
}) => {
  const formatTime = timestamp => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getCheckpointName = (type, index) => {
    switch (type) {
      case 'START':
        return startingPointName || 'Starting Point';
      case 'STOP_POINT':
        if (index !== null && index !== undefined && stopPoints[index]) {
          return stopPoints[index].stopName || `Stop ${index + 1}`;
        }
        return index !== null && index !== undefined
          ? `Stop ${index + 1}`
          : 'Stop';
      case 'ENDING':
        return endingPointName || 'Ending Point';
      default:
        return 'Unknown Checkpoint';
    }
  };

  const getCheckpointIcon = type => {
    switch (type) {
      case 'START':
        return 'play-circle';
      case 'STOP_POINT':
        return 'map-marker';
      case 'ENDING':
        return 'flag-checkered';
      default:
        return 'map-pin';
    }
  };

  const getGroupedArrivals = () => {
    const map = {};

    checkpointArrivals.forEach(arrival => {
      const key = `${arrival.checkpointType}-${
        arrival.checkpointIndex ?? 'null'
      }`;

      if (!map[key]) {
        map[key] = {
          type: arrival.checkpointType,
          index: arrival.checkpointIndex,
          name: getCheckpointName(
            arrival.checkpointType,
            arrival.checkpointIndex,
          ),
          arrivers: [],
        };
      }

      map[key].arrivers.push({
        username: arrival.riderUsername,
        arrivedAt: arrival.arrivedAt,
      });
    });

    return Object.values(map).sort((a, b) => {
      const typeSortOrder = {START: 0, STOP_POINT: 1, ENDING: 2};
      const diff = (typeSortOrder[a.type] || 3) - (typeSortOrder[b.type] || 3);
      if (diff !== 0) return diff;
      return (a.index ?? 0) - (b.index ?? 0);
    });
  };

  const groupedArrivals = getGroupedArrivals();

  return (
    <View style={finishedRideStyles.section}>
      <Text style={finishedRideStyles.sectionTitle}>Checkpoint Arrivals</Text>

      {groupedArrivals.length > 0 ? (
        <View>
          {groupedArrivals.map((checkpoint, idx) => (
            <View
              key={`checkpoint-${checkpoint.type}-${
                checkpoint.index ?? 'null'
              }-${idx}`}>
              {/* Checkpoint Header */}
              <View style={finishedRideStyles.checkpointHeader}>
                <View style={finishedRideStyles.checkpointIconContainer}>
                  <FontAwesome
                    name={getCheckpointIcon(checkpoint.type)}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={finishedRideStyles.checkpointTitleContainer}>
                  <Text style={finishedRideStyles.checkpointTitle}>
                    {checkpoint.name}
                  </Text>
                  <Text style={finishedRideStyles.checkpointCount}>
                    {checkpoint.arrivers.length} rider
                    {checkpoint.arrivers.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Arrivers List */}
              <View style={finishedRideStyles.arrivalsContainer}>
                {checkpoint.arrivers.map((arriver, arriverIdx) => (
                  <View
                    key={`arriver-${arriverIdx}`}
                    style={finishedRideStyles.arriverItem}>
                    <View style={finishedRideStyles.arriverAvatar}>
                      <Text style={finishedRideStyles.arriverInitial}>
                        {(arriver.username || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={finishedRideStyles.arriverInfo}>
                      <Text style={finishedRideStyles.arriverUsername}>
                        {arriver.username}
                      </Text>
                      <Text style={finishedRideStyles.arriverTime}>
                        {formatTime(arriver.arrivedAt)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={finishedRideStyles.emptyContainer}>
          <FontAwesome name="flag-o" size={32} color={colors.textSecondary} />
          <Text style={finishedRideStyles.emptyText}>
            No checkpoint arrivals recorded
          </Text>
        </View>
      )}
    </View>
  );
};

export default FinishedRideCheckpoints;
