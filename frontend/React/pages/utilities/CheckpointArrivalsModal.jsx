import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import checkpointModalStyles from '../../styles/screens/checkpointModalStyles';
import {getCheckpointArrivals} from '../../services/startService';
import colors from '../../styles/tokens/colors';

// ─── Helpers ────────────────────────────────────────────────────

const getCheckpointName = (
  type,
  index,
  stopPoints = [],
  endingPointName = 'Ending Point',
) => {
  switch (type) {
    case 'START':
      return 'Starting Point';
    case 'STOP_POINT':
      if (index !== null && index !== undefined && stopPoints[index]) {
        return stopPoints[index].name || `Stop ${index + 1}`;
      }
      return index !== null && index !== undefined
        ? `Stop ${index + 1}`
        : 'Stop';
    case 'ENDING':
      return endingPointName;
    default:
      return 'Unknown Checkpoint';
  }
};

const getCheckpointIcon = type => {
  switch (type) {
    case 'START':
      return (
        <FontAwesome name="play-circle" size={20} color={colors.tibetanRed50} />
      );
    case 'STOP_POINT':
      return (
        <FontAwesome name="map-marker" size={20} color={colors.tibetanRed50} />
      );
    case 'ENDING':
      return (
        <FontAwesome
          name="flag-checkered"
          size={20}
          color={colors.tibetanRed50}
        />
      );
    default:
      return (
        <FontAwesome name="map-pin" size={20} color={colors.tibetanRed50} />
      );
  }
};

const formatArrivalTime = timestamp => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const typeSortOrder = type => {
  if (type === 'START') return 0;
  if (type === 'STOP_POINT') return 1;
  if (type === 'ENDING') return 2;
  return 3;
};

const groupAndSortArrivals = (
  arrivals = [],
  stopPoints = [],
  endingPointName = 'Ending Point',
) => {
  const map = {};
  arrivals.forEach(arrival => {
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
          stopPoints,
          endingPointName,
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
    const diff = typeSortOrder(a.type) - typeSortOrder(b.type);
    if (diff !== 0) return diff;
    return (a.index ?? 0) - (b.index ?? 0);
  });
};

// ─── Component ──────────────────────────────────────────────────

const CheckpointArrivalsModal = ({
  visible,
  onClose,
  generatedRidesId,
  stopPoints = [],
  endingPointName = 'Ending Point',
  username, // current logged-in user
  onFinishRide, // only passed if user is the ride creator
  onNavigateToSummary, // only passed if user is NOT the ride creator
}) => {
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && generatedRidesId) {
      fetchCheckpointArrivals();
    }
  }, [visible, generatedRidesId]);

  const fetchCheckpointArrivals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCheckpointArrivals(generatedRidesId);
      setArrivals(data);
    } catch (err) {
      console.error('Error fetching checkpoint arrivals:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Has the current user reached the ending point?
  const currentUserAtEnding =
    !!username &&
    arrivals.some(
      a => a.checkpointType === 'ENDING' && a.riderUsername === username,
    );

  const sortedCheckpoints = groupAndSortArrivals(
    arrivals,
    stopPoints,
    endingPointName,
  );
  const s = checkpointModalStyles;

  // ─── Ending-point banner ──────────────────────────────────────
  const renderEndingBanner = () => {
    if (!currentUserAtEnding) return null;

    return (
      <View
        style={{
          backgroundColor: 'rgba(76,175,80,0.12)',
          borderColor: 'rgba(76,175,80,0.45)',
          borderWidth: 1,
          borderRadius: 10,
          marginHorizontal: 12,
          marginTop: 12,
          padding: 16,
          alignItems: 'center',
          gap: 6,
        }}>
        <FontAwesome name="flag-checkered" size={26} color="#4CAF50" />
        <Text
          style={{
            color: '#4CAF50',
            fontWeight: 'bold',
            fontSize: 15,
            marginTop: 4,
          }}>
          You've reached the finish line!
        </Text>

        {onFinishRide ? (
          // ── Creator: finish the ride ──────────────────────────
          <TouchableOpacity
            onPress={onFinishRide}
            style={{
              backgroundColor: '#4CAF50',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 32,
              marginTop: 6,
            }}>
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 15}}>
              Finish Ride
            </Text>
          </TouchableOpacity>
        ) : (
          // ── Non-creator: view summary (ride already finished by creator) ──
          <View style={{alignItems: 'center', gap: 8, marginTop: 4}}>
            <Text
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 13,
                textAlign: 'center',
              }}>
              The ride has been completed.
            </Text>
            {onNavigateToSummary && (
              <TouchableOpacity
                onPress={() => onNavigateToSummary(arrivals)}
                style={{
                  backgroundColor: '#4CAF50',
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 32,
                  marginTop: 2,
                }}>
                <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 15}}>
                  View Ride Summary
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // ─── Main content ─────────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#8c2323" />
          <Text style={s.loadingText}>Loading arrivals...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={s.errorContainer}>
          <FontAwesome name="exclamation-circle" size={36} color="#ef4444" />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity
            style={s.retryButton}
            onPress={fetchCheckpointArrivals}>
            <Text style={s.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (arrivals.length === 0) {
      return (
        <View style={s.emptyContainer}>
          <FontAwesome name="flag-o" size={36} color="#666" />
          <Text style={s.emptyText}>No checkpoint arrivals yet</Text>
        </View>
      );
    }

    return (
      <ScrollView style={{flexGrow: 1}} contentContainerStyle={s.scrollContent}>
        {sortedCheckpoints.map((checkpoint, idx) => (
          <View key={`${checkpoint.type}-${checkpoint.index ?? 'null'}-${idx}`}>
            <View style={s.checkpointHeader}>
              <Text style={s.checkpointIcon}>
                {getCheckpointIcon(checkpoint.type)}
              </Text>
              <View style={s.checkpointTitleContainer}>
                <Text style={s.checkpointTitle}>{checkpoint.name}</Text>
                <Text style={s.checkpointCount}>
                  {checkpoint.arrivers.length} rider
                  {checkpoint.arrivers.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {checkpoint.arrivers.map((arriver, arriverIdx) => (
              <View
                key={`arriver-${checkpoint.type}-${
                  checkpoint.index ?? 'null'
                }-${arriverIdx}`}
                style={s.arriverItem}>
                <View style={s.arriverAvatar}>
                  <Text style={s.arriverInitial}>
                    {(arriver.username || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={s.arriverInfo}>
                  <Text style={s.arriverUsername}>{arriver.username}</Text>
                  <Text style={s.arriverTime}>
                    {formatArrivalTime(arriver.arrivedAt)}
                  </Text>
                </View>
                <FontAwesome name="check-circle" size={20} color="#10b981" />
              </View>
            ))}

            {idx < sortedCheckpoints.length - 1 && <View style={s.divider} />}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Checkpoint Arrivals</Text>
            <TouchableOpacity onPress={onClose} style={s.closeButton}>
              <FontAwesome name="times" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Ending-point banner */}
          {renderEndingBanner()}

          {/* Arrivals list */}
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

export default CheckpointArrivalsModal;
