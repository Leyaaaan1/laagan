import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {getPersonalSummary} from '../../services/startService';
import finishedRideStyles from '../../styles/screens/finishedRideStyles';
import colors from '../../styles/tokens/colors';
import FinishedRideSummary from './FinishedRideSummary';
import FinishedRideCheckpoints from './FinishedRideCheckpoints';
import {
  isValidCoordinate,
  processRideCoordinates,
} from '../../utilities/CoordinateUtils';
import RouteMapView from '../../utilities/route/view/RouteMapView';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const PersonalSummaryView = ({route, navigation}) => {
  const {
    finishedRideData: passedData,
    generatedRidesId,
    username,
  } = route.params || {};

  const [rideData, setRideData] = useState(passedData || null);
  const [loading, setLoading] = useState(!passedData && !!generatedRidesId);
  const [error, setError] = useState(null);
  const [snapshotUri, setSnapshotUri] = useState(null);

  useEffect(() => {
    // FIX 1: guard against missing data before accessing passedData.u
    // FIX 2: load() was defined but the effect had no actual fetch call path —
    //         the console.log crashed when passedData was undefined
    if (passedData || !generatedRidesId) return;

    const load = async () => {
      try {
        // Only check riderStatus if we have a username to check against
        const data = await getPersonalSummary(generatedRidesId);

        setRideData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [generatedRidesId]); // only re-run if the ride ID changes

  const insets = useSafeAreaInsets();

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={finishedRideStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // ── Error / no data ───────────────────────────────────────────
  if (!rideData) {
    return (
      <SafeAreaView style={finishedRideStyles.container}>
        <View style={finishedRideStyles.errorContainer}>
          <FontAwesome
            name="exclamation-circle"
            size={40}
            color={colors.error}
          />
          <Text style={finishedRideStyles.errorText}>
            {error ||
              'Your Personal Summary will be available after the ride is completed.'}
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

  const safeArr = val => (Array.isArray(val) ? val : []);
  const safeArrivals = safeArr(rideData.checkpointArrivals);
  const safeStopPoints = safeArr(rideData.stopPoints);

  return (
    <SafeAreaView style={finishedRideStyles.container}>
      {/* Header */}
      <View style={[finishedRideStyles.header, {paddingTop: insets.top + 5}]}>
        <TouchableOpacity
          style={finishedRideStyles.backButtonSmall}
          onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={finishedRideStyles.headerTitle}>My Summary</Text>
        <TouchableOpacity
          style={finishedRideStyles.headerActionButton}
          onPress={() =>
            navigation.navigate('RideDetailView', {generatedRidesId})
          }>
          <FontAwesome name="bar-chart" size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={finishedRideStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={finishedRideStyles.personalBadge}>
          <FontAwesome name="user" size={12} color={colors.primary} />
          <Text style={finishedRideStyles.personalBadgeText}>
            Your personal checkpoint records
          </Text>
        </View>
        {isValidCoordinate(processRideCoordinates(rideData)?.startingPoint) && (
          <View style={{height: 200, marginBottom: 4}}>
            {snapshotUri ? (
              // Auto-captured static route snapshot, read from local device
              // storage — replaces the live interactive map once one exists
              // for this rider's personal finish. Falls back to the live
              // map below if not yet captured on this device.
              <Image
                source={{uri: snapshotUri}}
                style={{flex: 1, borderRadius: 8}}
                resizeMode="cover"
              />
            ) : (
              <RouteMapView
                generatedRidesId={generatedRidesId}
                startingPoint={processRideCoordinates(rideData).startingPoint}
                endingPoint={processRideCoordinates(rideData).endingPoint}
                stopPoints={processRideCoordinates(rideData).stopPoints}
                isDark={false}
                style={{flex: 1}}
              />
            )}
          </View>
        )}

        <FinishedRideSummary rideData={rideData} />

        <FinishedRideCheckpoints
          checkpointArrivals={safeArrivals}
          startingPointName={rideData.startingPointName}
          endingPointName={rideData.endingPointName}
          stopPoints={safeStopPoints}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PersonalSummaryView;
