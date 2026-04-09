import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {getLocationImage} from '../../../services/rideService';
import LinearGradient from 'react-native-linear-gradient';
import {getStopPointsByRideId} from '../../../services/startService';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import rideRoutes from '../../../styles/screens/rideRoutes';
import mapStyles from '../../../styles/components/mapStyles';
import badges from '../../../styles/base/badges';
import feedback from '../../../styles/base/feedback';
import images from '../../../styles/base/images';
import text from '../../../styles/base/text';

const RideRoutesPage = ({route}) => {
  const {startingPoint, generatedRidesId, endingPoint, token} = route.params;

  const [stopPoints, setStopPoints] = useState([]);
  const [stopPointsLoading, setStopPointsLoading] = useState(false);
  const [stopPointsError, setStopPointsError] = useState(null);
  const [stopPointImages, setStopPointImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});

  // ✅ NEW: Track which stop points are currently being loaded/already loaded
  // This is a ref (not state) so it doesn't capture stale values
  const loadedStopsRef = useRef(new Set());

  // Fetch stop points only (no images)
  const fetchStopPoints = useCallback(async () => {
    setStopPointsLoading(true);
    setStopPointsError(null);
    try {
      const data = await getStopPointsByRideId(generatedRidesId, token);
      const points = Array.isArray(data) ? data : [];
      setStopPoints(points);
    } catch (err) {
      setStopPointsError(err.message || 'Failed to load stop points');
    } finally {
      setStopPointsLoading(false);
    }
  }, [generatedRidesId, token]);

  // ✅ FIXED: Fetch images for a specific stop point (manual)
  // Now uses loadedStopsRef to guard against concurrent duplicate calls
  const fetchImagesForStop = useCallback(
    async stopName => {
      // ✅ Guard: Check if already loaded or currently loading (from ref, not state)
      if (loadedStopsRef.current.has(stopName)) {
        return;
      }

      // Mark as loading before making the API call
      loadedStopsRef.current.add(stopName);
      setLoadingImages(prev => ({...prev, [stopName]: true}));

      try {
        const imgs = await getLocationImage(stopName, token);
        setStopPointImages(prev => ({
          ...prev,
          [stopName]: Array.isArray(imgs) ? imgs : [],
        }));
      } catch (error) {
        console.error(`Error fetching images for ${stopName}:`, error);
        setStopPointImages(prev => ({
          ...prev,
          [stopName]: [], // Set empty array on error
        }));
      } finally {
        setLoadingImages(prev => ({...prev, [stopName]: false}));
      }
    },
    [token],
  );

  // ✅ FIXED: Load all images at once
  // Now uses ref guard to prevent concurrent duplicate fetches
  const loadAllImages = useCallback(async () => {
    for (const point of stopPoints) {
      // ✅ Guard: Check ref directly, not state
      if (!loadedStopsRef.current.has(point.stopName)) {
        await fetchImagesForStop(point.stopName);
      }
    }
  }, [stopPoints, fetchImagesForStop]);

  // Fetch stop points on mount only
  useEffect(() => {
    if (generatedRidesId && token) {
      fetchStopPoints();
    }
  }, [generatedRidesId, token, fetchStopPoints]);

  return (
    <ScrollView
      style={rideRoutes.scrollView}
      contentContainerStyle={{paddingBottom: 30}}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Header Section */}
      <LinearGradient
        colors={['#000', '#1a1a1a', '#000']}
        style={rideRoutes.headerGradient}>
        <View style={rideRoutes.header}>
          <View style={{marginTop: 24}}>
            <View style={rideRoutes.routeDetailsContainer}>
              <View style={mapStyles.routePoint}>
                <View style={mapStyles.routeStartDot} />
                <Text
                  style={[
                    mapStyles.routePointText,
                    {fontSize: 12, color: '#888', marginBottom: 4},
                  ]}>
                  Starting Point
                </Text>
                <Text style={mapStyles.routePointText} numberOfLines={2}>
                  {startingPoint}
                </Text>
              </View>

              <View style={mapStyles.routeConnection}>
                <FontAwesome name="arrow-right" size={18} color="#2e7d32" />
              </View>

              <View style={mapStyles.routePoint}>
                <View style={mapStyles.routeEndDot} />
                <Text
                  style={[
                    mapStyles.routePointText,
                    {fontSize: 12, color: '#888', marginBottom: 4},
                  ]}>
                  Ending Point
                </Text>
                <Text style={mapStyles.routePointText} numberOfLines={2}>
                  {endingPoint}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Stop Points Section */}
      <View style={[rideRoutes.stopPointsSection, {marginTop: 24}]}>
        <View style={rideRoutes.routeHeader}>
          <View style={rideRoutes.routeTitleRow}>
            <View style={rideRoutes.routeIndicator} />
            <Text style={rideRoutes.routeTitle}>Stop Points</Text>
            {stopPoints.length > 0 && (
              <View style={badges.countBadge}>
                <Text style={badges.countBadgeText}>{stopPoints.length}</Text>
              </View>
            )}
          </View>

          {stopPoints.length > 0 && (
            <TouchableOpacity
              onPress={loadAllImages}
              style={{
                marginTop: 12,
                backgroundColor: '#2e7d32',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <FontAwesome
                name="image"
                size={16}
                color="#fff"
                style={{marginRight: 8}}
              />
              <Text style={{color: '#fff', fontWeight: '600'}}>
                Load All Images
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {stopPointsLoading ? (
          <View style={feedback.loadingContainer}>
            <ActivityIndicator size="small" color="#2e7d32" />
            <Text style={feedback.loadingText}>Loading stop points...</Text>
          </View>
        ) : stopPointsError ? (
          <View style={feedback.errorContainer}>
            <Text style={{fontSize: 32, marginBottom: 12}}>⚠️</Text>
            <Text style={feedback.errorText}>{stopPointsError}</Text>
            <TouchableOpacity
              onPress={fetchStopPoints}
              style={{
                marginTop: 16,
                backgroundColor: '#2e7d32',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 8,
              }}>
              <Text style={{color: '#fff', fontWeight: '600'}}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : stopPoints.length > 0 ? (
          <View style={rideRoutes.stopPointsList}>
            {stopPoints.map((point, idx) => (
              <React.Fragment key={idx}>
                <View style={mapStyles.stopCard}>
                  <View style={mapStyles.stopHeader}>
                    <View style={mapStyles.stopNumber}>
                      <Text style={mapStyles.stopNumberText}>{idx + 1}</Text>
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={mapStyles.stopName}>{point.stopName}</Text>
                      <Text style={mapStyles.stopCoords}>Stop #{idx + 1}</Text>
                    </View>
                    <FontAwesome name="map-marker" size={18} color="#666" />
                  </View>

                  {/* Load Images Button */}
                  {!stopPointImages[point.stopName] &&
                    !loadingImages[point.stopName] && (
                      <TouchableOpacity
                        onPress={() => fetchImagesForStop(point.stopName)}
                        style={{
                          marginTop: 12,
                          backgroundColor: '#333',
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <FontAwesome
                          name="image"
                          size={14}
                          color="#fff"
                          style={{marginRight: 6}}
                        />
                        <Text style={{color: '#fff', fontSize: 13}}>
                          Load Images
                        </Text>
                      </TouchableOpacity>
                    )}

                  {/* Loading indicator */}
                  {loadingImages[point.stopName] && (
                    <View style={[feedback.loadingInline, {marginTop: 12}]}>
                      <ActivityIndicator size="small" color="#2e7d32" />
                      <Text
                        style={[
                          feedback.loadingText,
                          {fontSize: 12, marginTop: 4},
                        ]}>
                        Loading images...
                      </Text>
                    </View>
                  )}

                  {/* Stop images */}
                  {stopPointImages[point.stopName]?.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{marginTop: 16}}>
                      {stopPointImages[point.stopName].map((img, imgIdx) => (
                        <View
                          key={imgIdx}
                          style={{
                            marginRight: 12,
                            borderRadius: 12,
                            overflow: 'hidden',
                          }}>
                          <Image
                            source={{uri: img.imageUrl}}
                            style={{
                              width: 200,
                              height: 150,
                              backgroundColor: '#222',
                            }}
                          />
                          {(img.author || img.license) && (
                            <View style={images.metaOverlay}>
                              <Text style={images.metaText}>
                                {img.author ? `Photo: ${img.author}` : ''}
                                {img.author && img.license ? ' | ' : ''}
                                {img.license ? `License: ${img.license}` : ''}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  {/* No images */}
                  {stopPointImages[point.stopName]?.length === 0 && (
                    <Text style={text.muted}>No images available</Text>
                  )}
                </View>

                {idx < stopPoints.length - 1 && (
                  <View style={mapStyles.stopConnector} />
                )}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <View style={rideRoutes.emptyStopsContainer}>
            <Text style={rideRoutes.emptyStopsText}>
              No stop points on this route
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default RideRoutesPage;
