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

const CheckpointArrivalsModal = ({
  visible,
  onClose,
  generatedRidesId,
  stopPoints = [],
  endingPointName = 'Ending Point',
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
      const data = await getCheckpointArrivals(
        generatedRidesId,
      );
      setArrivals(data);
    } catch (err) {
      console.error('Error fetching checkpoint arrivals:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get checkpoint name based on type and index
  const getCheckpointName = (type, index) => {
    if (type === 'START') {
      return 'Starting Point';
    } else if (type === 'STOP_POINT' && stopPoints[index]) {
      return `${stopPoints[index].name || `Stop ${index + 1}`}`;
    } else if (type === 'ENDING') {
      return endingPointName;
    }
    return 'Unknown Checkpoint';
  };

  // Get checkpoint icon
  const getCheckpointIcon = type => {
    switch (type) {
      case 'START':
        return '🚀';
      case 'STOP_POINT':
        return '📍';
      case 'ENDING':
        return '🏁';
      default:
        return '📌';
    }
  };

  // Format timestamp
  const formatTime = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Group arrivals by checkpoint
  const groupedArrivals = arrivals.reduce((acc, arrival) => {
    const key = `${arrival.checkpointType}-${arrival.checkpointIndex}`;
    if (!acc[key]) {
      acc[key] = {
        type: arrival.checkpointType,
        index: arrival.checkpointIndex,
        name: getCheckpointName(
          arrival.checkpointType,
          arrival.checkpointIndex,
        ),
        arrivers: [],
      };
    }
    acc[key].arrivers.push({
      username: arrival.riderUsername,
      arrivedAt: arrival.arrivedAt,
    });
    return acc;
  }, {});

  const sortedCheckpoints = Object.values(groupedArrivals).sort((a, b) => {
    // START comes first
    if (a.type === 'START') return -1;
    if (b.type === 'START') return 1;

    // Then STOP_POINT in order
    if (a.type === 'STOP_POINT' && b.type === 'STOP_POINT') {
      return (a.index || 0) - (b.index || 0);
    }
    if (a.type === 'STOP_POINT') return -1;
    if (b.type === 'STOP_POINT') return 1;

    // ENDING comes last
    return 1;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={checkpointModalStyles.overlay}>
        <View style={checkpointModalStyles.container}>
          {/* Header */}
          <View style={checkpointModalStyles.header}>
            <Text style={checkpointModalStyles.title}>Checkpoint Arrivals</Text>
            <TouchableOpacity
              onPress={onClose}
              style={checkpointModalStyles.closeButton}>
              <FontAwesome name="times" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={checkpointModalStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#1e40af" />
              <Text style={checkpointModalStyles.loadingText}>
                Loading arrivals...
              </Text>
            </View>
          ) : error ? (
            <View style={checkpointModalStyles.errorContainer}>
              <FontAwesome
                name="exclamation-circle"
                size={40}
                color="#f44336"
              />
              <Text style={checkpointModalStyles.errorText}>{error}</Text>
              <TouchableOpacity
                style={checkpointModalStyles.retryButton}
                onPress={fetchCheckpointArrivals}>
                <Text style={checkpointModalStyles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : arrivals.length === 0 ? (
            <View style={checkpointModalStyles.emptyContainer}>
              <FontAwesome name="info-circle" size={40} color="#999" />
              <Text style={checkpointModalStyles.emptyText}>
                No checkpoint arrivals yet
              </Text>
            </View>
          ) : (
            <ScrollView style={checkpointModalStyles.scrollContent}>
              {sortedCheckpoints.map((checkpoint, idx) => (
                <View key={`${checkpoint.type}-${checkpoint.index}-${idx}`}>
                  {/* Checkpoint Header */}
                  <View style={checkpointModalStyles.checkpointHeader}>
                    <Text style={checkpointModalStyles.checkpointIcon}>
                      {getCheckpointIcon(checkpoint.type)}
                    </Text>
                    <View
                      style={checkpointModalStyles.checkpointTitleContainer}>
                      <Text style={checkpointModalStyles.checkpointTitle}>
                        {checkpoint.name}
                      </Text>
                      <Text style={checkpointModalStyles.checkpointCount}>
                        {checkpoint.arrivers.length} rider
                        {checkpoint.arrivers.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Arrivers List */}
                  {checkpoint.arrivers.map((arriver, arriverIdx) => (
                    <View
                      key={`${checkpoint.type}-${checkpoint.index}-${arriverIdx}`}
                      style={checkpointModalStyles.arriverItem}>
                      <View style={checkpointModalStyles.arriverAvatar}>
                        <Text style={checkpointModalStyles.arriverInitial}>
                          {(arriver.username || 'U')[0].toUpperCase()}
                        </Text>
                      </View>

                      <View style={checkpointModalStyles.arriverInfo}>
                        <Text style={checkpointModalStyles.arriverUsername}>
                          {arriver.username}
                        </Text>
                        <Text style={checkpointModalStyles.arriverTime}>
                          {formatTime(arriver.arrivedAt)}
                        </Text>
                      </View>

                      <FontAwesome
                        name="check-circle"
                        size={20}
                        color="#4CAF50"
                      />
                    </View>
                  ))}

                  {/* Divider */}
                  {idx < sortedCheckpoints.length - 1 && (
                    <View style={checkpointModalStyles.divider} />
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Footer */}
          <TouchableOpacity
            style={checkpointModalStyles.closeBtn}
            onPress={onClose}>
            <Text style={checkpointModalStyles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CheckpointArrivalsModal;
