import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../styles/tokens/colors';
import finishedRideStyles from '../../styles/screens/finishedRideStyles';
import {
  getCheckpointArrivals,
  getFinishedRideSummary,
  getPersonalSummary,
  getRideStatus,
} from '../../services/startService';
import FinishedRideSummary from './FinishedRideSummary';
import FinishedRideParticipants from './FinishedRideParticipants';
import FinishedRideCheckpoints from './FinishedRideCheckpoints';
import RouteMapView from '../../utilities/route/view/RouteMapView';
import {
  isValidCoordinate,
  processRideCoordinates,
} from '../../utilities/CoordinateUtils';
import {useAuth} from '../../context/AuthContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const enrichParticipants = (
  participants = [],
  checkpointArrivals = [],
  stopPoints = [],
) => {
  const totalCheckpoints = 1 + stopPoints.length + 1;
  return participants.map(p => {
    const reached = checkpointArrivals.filter(
      a => a.riderUsername === p.username,
    ).length;
    return {...p, checkpointsReached: reached, totalCheckpoints};
  });
};

const safe = val => (Array.isArray(val) ? val : []);

const FinishedRideView = ({route, navigation}) => {
  const {username: currentUsername} = useAuth();
  const {
    finishedRideData: passedData,
    generatedRidesId,
    isRideActive,
    isPersonalSummary,
    hideQuickActions,
    rideName,
    startingPointName: passedStartingPointName,
    endingPointName: passedEndingPointName,
    stopPoints: passedStopPoints,
    participantCount: passedParticipantCount,
    participants: passedParticipants,
    startTime: passedStartTime,
  } = route.params || {};

  const [finishedRideData, setFinishedRideData] = useState(passedData || null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(!passedData && !!generatedRidesId);
  const [error, setError] = useState(null);

  // ── Load finished ride data ──────────────────────────────────────
  useEffect(() => {
    if (passedData || !generatedRidesId) return;

    const load = async () => {
      try {
        const statusData = await getRideStatus(generatedRidesId);

        if (isPersonalSummary) {
          const data = await getPersonalSummary(generatedRidesId);
          setFinishedRideData(data);
          return;
        }

        if (statusData.currentStatus === 'FINISHED') {
          // getFinishedRideSummary now returns routeCoordinates + averageSpeedKph + photos
          const data = await getFinishedRideSummary(generatedRidesId);
          setFinishedRideData(data);
          setPhotos(safe(data.photos));
          return;
        }

        // Still active — load live arrivals (no route stats yet)
        const arrivals = await getCheckpointArrivals(generatedRidesId);
        setFinishedRideData({
          rideName,
          startingPointName: passedStartingPointName,
          endingPointName: passedEndingPointName,
          stopPoints: passedStopPoints || [],
          participantCount: passedParticipantCount,
          startTime: passedStartTime,
          checkpointArrivals: arrivals,
          completedParticipants: (passedParticipants || []).map(p => ({
            username: typeof p === 'string' ? p : p.username,
          })),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [generatedRidesId]);

  const insets = useSafeAreaInsets();

  // ── Derive map coordinates from the finished ride data ───────────
  const mapCoords = (() => {
    if (!finishedRideData) return null;
    return processRideCoordinates(finishedRideData);
  })();

  const hasRoute = !!(
    finishedRideData?.routeCoordinates ||
    isValidCoordinate(mapCoords?.startingPoint) ||
    isValidCoordinate(mapCoords?.endingPoint)
  );

  // ── Loading / error states ───────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={finishedRideStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!finishedRideData) {
    return (
      <SafeAreaView style={finishedRideStyles.container}>
        <View style={finishedRideStyles.errorContainer}>
          <FontAwesome
            name="exclamation-circle"
            size={40}
            color={colors.error}
          />
          <Text style={finishedRideStyles.errorText}>
            {error || 'No ride data available'}
          </Text>
          <TouchableOpacity
            style={finishedRideStyles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={finishedRideStyles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const {
    participantCount,
    completedParticipants,
    checkpointArrivals,
    startingPointName,
    endingPointName,
    stopPoints,
    distance,
    durationMinutes,
    averageSpeedKph,
    routeCoordinates,
  } = finishedRideData;

  const safeParticipants = safe(completedParticipants);
  const safeArrivals = safe(checkpointArrivals);
  const safeStopPoints = safe(stopPoints);
  const enrichedParticipants = enrichParticipants(
    safeParticipants,
    safeArrivals,
    safeStopPoints,
  );

  const headerTitle = isPersonalSummary
    ? 'My Summary'
    : isRideActive && !passedData
    ? 'Live Arrivals'
    : 'Ride Summary';

  const isParticipant = safeParticipants.some(
    p => p.username === currentUsername,
  );
  const canUploadPhotos = isParticipant || !isPersonalSummary;

  return (
    <View style={[finishedRideStyles.container, {paddingTop: insets.top}]}>
      {/* Header */}
      <View style={finishedRideStyles.header}>
        <TouchableOpacity
          style={finishedRideStyles.backButtonSmall}
          onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={finishedRideStyles.headerTitle}>{headerTitle}</Text>

        {/* Right-side action buttons */}
        {!hideQuickActions && (
          <View style={localStyles.headerActions}>
          {/* Ride Detail */}
          <TouchableOpacity
            style={finishedRideStyles.headerActionButton}
            onPress={() =>
              navigation.navigate('RideDetailView', {generatedRidesId})
            }>
            <FontAwesome name="bar-chart" size={15} color={colors.primary} />
          </TouchableOpacity>

          {/* My Summary */}
          <TouchableOpacity
            style={finishedRideStyles.headerActionButton}
            onPress={() =>
              navigation.navigate('PersonalSummaryView', {generatedRidesId})
            }>
            <FontAwesome name="user" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
          )}
      </View>

      <ScrollView
        contentContainerStyle={finishedRideStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {hasRoute && (
          <View style={localStyles.mapWrapper}>
            <RouteMapView
              generatedRidesId={generatedRidesId}
              startingPoint={mapCoords?.startingPoint}
              endingPoint={mapCoords?.endingPoint}
              stopPoints={mapCoords?.stopPoints || []}
              isDark={false}
              style={{flex: 1}}
            />
          </View>
        )}

        <FinishedRideSummary rideData={finishedRideData} />

        {!isPersonalSummary && (
          <FinishedRideParticipants
            participants={enrichedParticipants}
            participantCount={participantCount}
          />
        )}

        <FinishedRideCheckpoints
          checkpointArrivals={safeArrivals}
          startingPointName={startingPointName}
          endingPointName={endingPointName}
          stopPoints={safeStopPoints}
        />
      </ScrollView>
    </View>
  );};

const localStyles = StyleSheet.create({
  mapWrapper: {
    height: 240,
    marginHorizontal: 0,
    marginBottom: 4,
    overflow: 'hidden',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default FinishedRideView;
