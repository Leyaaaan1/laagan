// File: frontend/React/pages/utilities/CheckpointArrivalsModal.jsx

import React, {useState, useEffect, useCallback, useRef} from 'react';
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
import {
  getCheckpointArrivals,
  getRideStatusDetailed,
} from '../../services/startService';
import {useFinishRideHandler} from './hooks/UseFinishRideHandler';
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

const formatArrivalTime = timestamp => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
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
    const order = {START: 0, STOP_POINT: 1, ENDING: 2};
    const diff = (order[a.type] || 3) - (order[b.type] || 3);
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
  username,
  isCreator,
  activeRide,
  stopPolling,
  setPollingEnabled,
  onRideFinished,
  onNavigateToSummary,
  snapshotContainerRef,
  polygonSnapshotOptions,
}) => {
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rideStatus, setRideStatus] = useState(null);
  const isNavigatingRef = useRef(false);

  // Keep stable refs so fetchCheckpointArrivals never needs these callbacks in
  // its dependency array — prevents the re-creation loop that caused the modal
  // to flicker open/close whenever the parent re-rendered.
  const onCloseRef = useRef(onClose);
  const onNavigateToSummaryRef = useRef(onNavigateToSummary);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    onNavigateToSummaryRef.current = onNavigateToSummary;
  }, [onNavigateToSummary]);

  const {
    isFinishing,
    finishingAction,
    handleFinishRide,
    handleForceFinishRide,
  } = useFinishRideHandler(
    activeRide,
    stopPolling,
    setPollingEnabled,
    onRideFinished,
    snapshotContainerRef,
    polygonSnapshotOptions,
  );

  const fetchCheckpointArrivals = useCallback(async () => {
    if (!generatedRidesId || generatedRidesId === 'undefined') return; // ← ADD
    try {
      setLoading(true);
      setError(null);

      const [arrivalsResult, statusResult] = await Promise.allSettled([
        getCheckpointArrivals(generatedRidesId),
        getRideStatusDetailed(generatedRidesId),
      ]);

      const data =
        arrivalsResult.status === 'fulfilled' ? arrivalsResult.value : [];
      const statusData =
        statusResult.status === 'fulfilled' ? statusResult.value : null;

      // Only throw (set error state) if arrivals themselves failed
      if (arrivalsResult.status === 'rejected') {
        throw arrivalsResult.reason;
      }

      setArrivals(data);
      setRideStatus(statusData);

      if (statusData?.currentStatus === 'FINISHED') {
        onNavigateToSummaryRef.current?.(generatedRidesId);
        return;
      }
      if (statusData?.currentStatus === 'STOPPED') {
        onCloseRef.current?.();
        Alert.alert(
          'Ride Stopped',
          'This ride has been stopped by the creator.',
        );
        return;
      }
    } catch (err) {
      setError(err.message);
      const isForbidden =
        err.message?.toLowerCase().includes('auth_forbidden') ||
        err.message?.toLowerCase().includes('forbidden') ||
        err.message?.toLowerCase().includes('not a participant');
      if (!isForbidden) {
        Alert.alert('Error', err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [generatedRidesId]); // ← only the ride ID; callbacks are accessed via refs

  useEffect(() => {
    if (!visible || !generatedRidesId || generatedRidesId === 'undefined')
      return;
    if (activeRide?.active === false) {
      onNavigateToSummaryRef.current?.(generatedRidesId);
      return;
    }
    fetchCheckpointArrivals();
  }, [visible, generatedRidesId, activeRide?.active, fetchCheckpointArrivals]);

  const currentUserAtEnding =
    !!username &&
    (arrivals.some(
      a => a.checkpointType === 'ENDING' && a.riderUsername === username,
    ) ||
      rideStatus?.riderStatuses?.some(
        r => r.riderUsername === username && r.status === 'RIDER_FINISHED',
      ));

  const finishedRiderCount =
    rideStatus?.riderStatuses?.filter(r => r.status === 'RIDER_FINISHED')
      .length ?? 0;
  const totalRiderCount = rideStatus?.riderStatuses?.length ?? 0;

  const sortedCheckpoints = groupAndSortArrivals(
    arrivals,
    stopPoints,
    endingPointName,
  );
  const s = checkpointModalStyles;

  // ─── Status banner ────────────────────────────────────────────
  const renderStatusBanner = () => {
    // Creator has NOT reached ending
    if (!currentUserAtEnding) {
      return (
        <View style={s.bannerWarning}>
          <View style={s.bannerIconRow}>
            <FontAwesome
              name="exclamation-triangle"
              size={18}
              color="#ef4444"
            />
            <Text style={s.bannerWarningText}>
              You haven't reached the finish line yet.
            </Text>
          </View>
          <TouchableOpacity
            disabled={isFinishing}
            onPress={() => {
              if (isCreator) {
                Alert.alert(
                  'Force End Ride',
                  'End just your own ride, or end it for every participant?',
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'End My Ride Only',
                      onPress: () => handleForceFinishRide(false),
                    },
                    {
                      text: 'End For Everyone',
                      style: 'destructive',
                      onPress: () => handleForceFinishRide(true),
                    },
                  ],
                );
              } else {
                Alert.alert(
                  'Force End Ride',
                  'This will end the ride for you only — other riders can continue. Are you sure?',
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'Force End',
                      style: 'destructive',
                      onPress: () => handleForceFinishRide(false),
                    },
                  ],
                );
              }
            }}
            style={[
              s.bannerButton,
              s.bannerButtonDanger,
              isFinishing && s.bannerButtonDisabled,
            ]}>
            {finishingAction === 'force' ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <FontAwesome name="stop-circle" size={13} color="#ef4444" />
            )}
            <Text style={s.bannerButtonDangerText}>
              {finishingAction === 'force' ? 'Ending…' : 'Force End Ride'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // At ending — creator
    if (isCreator) {
      return (
        <View style={s.bannerSuccess}>
          <View style={s.bannerIconRow}>
            <FontAwesome name="flag-checkered" size={20} color="#4CAF50" />
            <Text style={s.bannerSuccessTitle}>Finish line reached!</Text>
          </View>

          {/* End Your Ride */}
          <TouchableOpacity
            disabled={isFinishing}
            onPress={handleFinishRide}
            style={[
              s.bannerButton,
              s.bannerButtonSuccess,
              isFinishing && s.bannerButtonDisabled,
            ]}>
            {finishingAction === 'normal' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome name="check-circle" size={13} color="#fff" />
            )}
            <Text style={s.bannerButtonSuccessText}>
              {finishingAction === 'normal' ? 'Ending…' : 'End Your Ride'}
            </Text>
          </TouchableOpacity>

          <View style={s.bannerDivider}>
            <View style={s.bannerDividerLine} />
            <Text style={s.bannerDividerText}>or</Text>
            <View style={s.bannerDividerLine} />
          </View>

          <TouchableOpacity
            disabled={isFinishing}
            onPress={() => {
              Alert.alert(
                'Force End Ride',
                'End just your own ride, or end it for every participant?',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'End My Ride Only',
                    onPress: () => handleForceFinishRide(false),
                  },
                  {
                    text: 'End For Everyone',
                    style: 'destructive',
                    onPress: () => handleForceFinishRide(true),
                  },
                ],
              );
            }}
            style={[
              s.bannerButton,
              s.bannerButtonDanger,
              s.bannerButtonOutline,
              isFinishing && s.bannerButtonDisabled,
            ]}>
            {finishingAction === 'force' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <FontAwesome
                name="stop-circle"
                size={13}
                color={colors.primary}
              />
            )}
            <Text style={s.bannerButtonDangerText}>
              {finishingAction === 'force' ? 'Ending…' : 'Force End Ride'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    // At ending — participant
    return (
      <View style={s.bannerSuccess}>
        <View style={s.bannerIconRow}>
          <FontAwesome name="flag-checkered" size={20} color="#4CAF50" />
          <Text style={s.bannerSuccessTitle}>
            Great job completing the ride!
          </Text>
        </View>
        <TouchableOpacity
          disabled={isFinishing}
          onPress={handleFinishRide}
          style={[
            s.bannerButton,
            s.bannerButtonSuccess,
            isFinishing && s.bannerButtonDisabled,
          ]}>
          {isFinishing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome name="check-circle" size={13} color="#fff" />
          )}
          <Text style={s.bannerButtonSuccessText}>
            {isFinishing ? 'Ending…' : 'End Your Ride'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Arrivals content ─────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Loading arrivals…</Text>
        </View>
      );
    }

    if (error) {
      const isForbidden =
        error?.toLowerCase().includes('auth_forbidden') ||
        error?.toLowerCase().includes('forbidden') ||
        error?.toLowerCase().includes('not a participant');

      // Participants hit forbidden from backend — just show empty state, not a lock screen
      if (isForbidden && !isCreator) {
        return (
          <View style={s.emptyContainer}>
            <View style={s.emptyIconWrap}>
              <FontAwesome
                name="flag-o"
                size={26}
                color={colors.textSecondary}
              />
            </View>
            <Text style={s.emptyText}>No checkpoint arrivals yet</Text>
            <Text style={s.emptySubText}>Waiting for riders to check in…</Text>
          </View>
        );
      }

      if (isForbidden) {
        return (
          <View style={s.forbiddenContainer}>
            <FontAwesome name="lock" size={36} color={colors.textMuted} />
            <Text style={s.forbiddenTitle}>Access Restricted</Text>
            <Text style={s.forbiddenText}>
              You're not a participant of this ride. Only riders who joined can
              view checkpoint arrivals.
            </Text>
          </View>
        );
      }

      return (
        <View style={s.errorContainer}>
          <FontAwesome name="exclamation-circle" size={32} color="#ef4444" />
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
          <View style={s.emptyIconWrap}>
            <FontAwesome name="flag-o" size={26} color={colors.textSecondary} />
          </View>
          <Text style={s.emptyText}>No checkpoint arrivals yet</Text>
          <Text style={s.emptySubText}>Waiting for riders to check in…</Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}>
        {/* Timeline */}
        <View style={s.timelineContainer}>
          {sortedCheckpoints.map((checkpoint, idx) => {
            const isLast = idx === sortedCheckpoints.length - 1;
            const hasArrivers = checkpoint.arrivers.length > 0;

            return (
              <View
                key={`${checkpoint.type}-${checkpoint.index ?? 'null'}-${idx}`}
                style={s.timelineRow}>
                {/* Left rail */}
                <View style={s.timelineLeft}>
                  <View
                    style={[
                      s.timelineIconWrap,
                      hasArrivers && s.timelineIconWrapActive,
                    ]}>
                    <FontAwesome
                      name={getCheckpointIconName(checkpoint.type)}
                      size={14}
                      color={
                        hasArrivers ? colors.primary : colors.textSecondary
                      }
                    />
                    <Text
                      style={{
                        fontSize: 9,
                        color: hasArrivers
                          ? colors.white
                          : colors.textSecondary,
                        textAlign: 'center',
                        marginTop: 2,
                        fontWeight: '600',
                      }}>
                      {checkpoint.type === 'STOP_POINT'
                        ? `Stop ${(checkpoint.index ?? 0) + 1}`
                        : checkpoint.type === 'ENDING'
                        ? 'End'
                        : 'Start'}
                    </Text>
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        s.timelineLine,
                        hasArrivers && s.timelineLineActive,
                      ]}
                    />
                  )}
                </View>
                {/* Right content */}
                <View style={s.timelineContent}>
                  <View
                    style={[
                      s.checkpointHeader,
                      hasArrivers && s.checkpointHeaderActive,
                    ]}>
                    <View style={s.checkpointTitleContainer}>
                      <Text style={s.checkpointTitle}>{checkpoint.name}</Text>
                      <Text style={s.checkpointCount}>
                        {checkpoint.arrivers.length}{' '}
                        {checkpoint.arrivers.length !== 1 ? 'riders' : 'rider'}
                      </Text>
                    </View>
                  </View>

                  {hasArrivers && (
                    <View style={s.arriversList}>
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
                            <Text style={s.arriverUsername}>
                              {arriver.username}
                            </Text>
                            <Text style={s.arriverTime}>
                              {formatArrivalTime(arriver.arrivedAt)}
                            </Text>
                          </View>
                          <FontAwesome
                            name="check-circle"
                            size={16}
                            color="#10b981"
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Checkpoint Arrivals</Text>
            <TouchableOpacity onPress={onClose} style={s.closeButton}>
              <FontAwesome name="times" size={14} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Status banner */}
          {renderStatusBanner()}

          {/* Content */}
          {renderContent()}

          {/* Footer */}
          <View style={s.footer}>
            <View style={s.footerPill}>
              <TouchableOpacity
                style={[s.footerSegment]}
                onPress={fetchCheckpointArrivals}>
                <FontAwesome
                  name="refresh"
                  size={14}
                  color="rgba(255,255,255,0.6)"
                />
                <Text
                  style={[
                    s.footerSegmentText,
                    {
                      color: 'rgba(255,255,255,0.6)',
                    },
                  ]}>
                  Refresh
                </Text>
              </TouchableOpacity>
              <View style={s.footerPillDivider} />
              <TouchableOpacity
                style={[s.footerSegment, s.footerSegmentClose]}
                onPress={onClose}>
                <FontAwesome name="times" size={14} color="#fff" />
                <Text style={s.footerSegmentText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CheckpointArrivalsModal;
