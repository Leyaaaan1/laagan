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

  const getCheckpointIconName = type => {
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
      const order = {START: 0, STOP_POINT: 1, ENDING: 2};
      const diff = (order[a.type] || 3) - (order[b.type] || 3);
      if (diff !== 0) return diff;
      return (a.index ?? 0) - (b.index ?? 0);
    });
  };

  const groupedArrivals = getGroupedArrivals();
  const hasArrivals = groupedArrivals.length > 0;

  return (
    <View style={finishedRideStyles.section}>
      {/* Section header */}
      <View style={finishedRideStyles.sectionHeader}>
        <Text style={finishedRideStyles.sectionTitle}>Checkpoints</Text>
        {hasArrivals && (
          <View style={finishedRideStyles.sectionBadge}>
            <Text style={finishedRideStyles.sectionBadgeText}>
              {groupedArrivals.length}
            </Text>
          </View>
        )}
      </View>

      {hasArrivals ? (
        <View style={finishedRideStyles.timelineContainer}>
          {groupedArrivals.map((checkpoint, idx) => {
            const isLast = idx === groupedArrivals.length - 1;
            const hasArrivers = checkpoint.arrivers.length > 0;

            return (
              <View
                key={`checkpoint-${checkpoint.type}-${
                  checkpoint.index ?? 'null'
                }-${idx}`}
                style={finishedRideStyles.timelineRow}>
                {/* Left: icon + vertical line */}
                <View style={finishedRideStyles.timelineLeft}>
                  <View
                    style={[
                      finishedRideStyles.timelineIconWrap,
                      hasArrivers && finishedRideStyles.timelineIconWrapActive,
                    ]}>
                    <FontAwesome
                      name={getCheckpointIconName(checkpoint.type)}
                      size={15}
                      color={
                        hasArrivers ? colors.primary : colors.textSecondary
                      }
                    />
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        finishedRideStyles.timelineLine,
                        hasArrivers && finishedRideStyles.timelineLineActive,
                      ]}
                    />
                  )}
                </View>

                {/* Right: header + arrivers */}
                <View style={finishedRideStyles.timelineContent}>
                  {/* Checkpoint header */}
                  <View
                    style={[
                      finishedRideStyles.timelineHeader,
                      hasArrivers && finishedRideStyles.timelineHeaderActive,
                    ]}>
                    <Text style={finishedRideStyles.timelineName}>
                      {checkpoint.name}
                    </Text>
                    <Text style={finishedRideStyles.timelineCount}>
                      {checkpoint.arrivers.length}{' '}
                      {checkpoint.arrivers.length !== 1 ? 'riders' : 'rider'}
                    </Text>
                  </View>

                  {/* Arrivers */}
                  {hasArrivers && (
                    <View style={finishedRideStyles.timelineArrivers}>
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
                          <View style={finishedRideStyles.arriverCheck}>
                            <FontAwesome
                              name="check-circle"
                              size={16}
                              color="#4CAF50"
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={finishedRideStyles.emptyContainer}>
          <View style={finishedRideStyles.emptyIconWrap}>
            <FontAwesome name="flag-o" size={22} color={colors.textSecondary} />
          </View>
          <Text style={finishedRideStyles.emptyText}>
            No checkpoint arrivals recorded
          </Text>
          <Text style={finishedRideStyles.emptySubText}>
            Data will appear once riders pass checkpoints
          </Text>
        </View>
      )}
    </View>
  );
};

export default FinishedRideCheckpoints;
