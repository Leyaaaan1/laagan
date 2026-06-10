import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import {getLocationImage} from '../../../services/rideService';
import {getStopPointsByRideId} from '../../../services/startService';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import rideRoutes from '../../../styles/screens/rideRoutes';
import timeline from '../../../styles/components/timeline';
import feedback from '../../../styles/base/feedback';
import {useAuth} from '../../../context/AuthContext';

// Enable LayoutAnimation on Android
if (
  UIManager.setLayoutAnimationEnabledExperimental &&
  Platform.OS === 'android'
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TimelineNode = ({type, index, isLastNode, isFirstNode}) => {
  switch (type) {
    case 'START':
      return (
        <>
          {/* Green circle for starting point */}
          <View style={timeline.nodeContainer}>
            <View style={timeline.startingPointNode}>
              <FontAwesome name="circle" size={12} color="#fff" />
            </View>
          </View>
          {!isLastNode && <View style={timeline.connectorLine} />}
        </>
      );

    case 'STOP':
      return (
        <>
          <View style={timeline.nodeContainer}>
            <View style={timeline.stopNode}>
              <Text style={timeline.stopNodeText}>{index}</Text>
            </View>
          </View>
          {!isLastNode && <View style={timeline.connectorLine} />}
        </>
      );

    case 'END':
      return (
        <>
          <View style={timeline.nodeContainer}>
            <View style={timeline.endPointNode}>
              <FontAwesome name="map-pin" size={12} color="#fff" />
            </View>
          </View>
          {!isLastNode && <View style={timeline.connectorLine} />}
        </>
      );

    default:
      return null;
  }
};

const TimelineStopCard = ({
  stopData,
  type,
  stopIndex,
  isFirstNode,
  isLastNode,
  onPress,
  isExpanded,
  images,
  isLoadingImages,
  onLoadImages,
}) => {
  const getStopLabel = () => {
    if (type === 'START') {return 'Starting Point';}
    if (type === 'END') {return 'Ending Point';}
    return `Stop ${stopIndex}`;
  };

  const handleCardPress = () => {
    LayoutAnimation.easeInEaseOut();
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleCardPress}
      style={timeline.cardContainer}>
      <View style={timeline.card}>
        {/* Stop Type Label */}
        <View style={timeline.cardHeader}>
          <Text style={timeline.stopLabel}>{getStopLabel()}</Text>
          <FontAwesome
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#888"
            style={{opacity: 0.6}}
          />
        </View>

        {/* Stop Name */}
        <Text style={timeline.stopName} numberOfLines={1}>
          {stopData.stopName}
        </Text>

        {/* Distance/Duration Chip (if not first node) */}
        {!isFirstNode && (
          <View style={timeline.distanceChip}>
            <Text style={timeline.distanceChipText}>
              {stopData.distance || '—'} • {stopData.duration || 'calc...'}
            </Text>
          </View>
        )}

        {/* Expandable Images Section */}
        {isExpanded && (
          <View style={timeline.expandedContent}>
            {/* Load Images Button */}
            {!images || images.length === 0 ? (
              <TouchableOpacity
                onPress={onLoadImages}
                disabled={isLoadingImages}
                style={timeline.loadImagesButton}>
                {isLoadingImages ? (
                  <>
                    <ActivityIndicator size="small" color="#10b981" />
                    <Text style={timeline.loadImagesButtonText}>
                      Loading...
                    </Text>
                  </>
                ) : (
                  <>
                    <FontAwesome
                      name="image"
                      size={14}
                      color="#10b981"
                      style={{marginRight: 6}}
                    />
                    <Text style={timeline.loadImagesButtonText}>
                      Load Images
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 8,
                }}>
                {images.slice(0, 5).map((img, idx) => {
                  const isFirst = idx === 0;
                  const size = isFirst ? 160 : 74;
                  return (
                    <View
                      key={idx}
                      style={{
                        width: size,
                        height: size,
                        borderRadius: 8,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: '#2a2a2a',
                      }}>
                      <Image
                        source={{
                          uri: img.imageUrl,
                          headers: {
                            'User-Agent':
                              'RidersHubApp/1.0 (Android; contact@ridershub.app)',
                            Referer: 'https://commons.wikimedia.org/',
                          },
                        }}
                        style={{width: size, height: size}}
                        resizeMode="cover"
                        onError={e =>
                          console.warn(
                            'IMG ERR',
                            img.imageUrl,
                            e.nativeEvent.error,
                          )
                        }
                      />
                      {img.author && (
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'rgba(0,0,0,0.55)',
                            paddingHorizontal: 5,
                            paddingVertical: 3,
                          }}>
                          <Text
                            style={{
                              color: '#ccc',
                              fontSize: 9,
                              fontWeight: '500',
                            }}
                            numberOfLines={1}>
                            {img.author}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const RideRoutesPage = ({route}) => {
  const {token: authToken} = useAuth();
  const {
    startingPoint,
    generatedRidesId,
    endingPoint,
    token: paramToken,
  } = route.params;

  console.log('params', route);

  const token = paramToken || authToken;
  const [stopPoints, setStopPoints] = useState([]);
  const [stopPointsLoading, setStopPointsLoading] = useState(false);
  const [stopPointsError, setStopPointsError] = useState(null);
  const [stopPointImages, setStopPointImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  const [expandedIndex, setExpandedIndex] = useState(null);

  const loadedStopsRef = useRef(new Set());

  const fetchStopPoints = useCallback(async () => {
    setStopPointsLoading(true);
    setStopPointsError(null);
    try {
      const data = await getStopPointsByRideId(generatedRidesId, token);
      const points = Array.isArray(data) ? data : [];
      setStopPoints(points);
    }  catch (err) {
    setStopPointsError(err.message || 'Failed to load stop points');
  } finally {
      setStopPointsLoading(false);
    }
  }, [generatedRidesId, token]);

  const fetchImagesForStop = useCallback(
    async stopName => {
      if (loadedStopsRef.current.has(stopName)) {
        return;
      }

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
          [stopName]: [],
        }));
      } finally {
        setLoadingImages(prev => ({...prev, [stopName]: false}));
      }
    },
    [token],
  );

  const loadAllImages = useCallback(async () => {
    if (stopPoints.length > 0) {
      await fetchImagesForStop(startingPoint);
    }
    for (const point of stopPoints) {
      await fetchImagesForStop(point.stopName);
    }
    if (endingPoint) {
      await fetchImagesForStop(endingPoint);
    }
  }, [stopPoints, startingPoint, endingPoint, fetchImagesForStop]);

  useEffect(() => {
    if (generatedRidesId && token) {
      fetchStopPoints();
    }
  }, [generatedRidesId, token, fetchStopPoints]);

  // Build timeline data with start, stops, and end
  const buildTimelineData = () => {
    const data = [
      {
        type: 'START',
        stopName: startingPoint || 'Starting Point',
        index: 0,
      },
    ];

    stopPoints.forEach((point, idx) => {
      data.push({
        type: 'STOP',
        stopName: point.stopName,
        distance: point.distance || null,
        duration: point.duration || null,
        index: idx + 1,
        stopData: point,
      });
    });

    data.push({
      type: 'END',
      stopName: endingPoint || 'Ending Point',
      index: stopPoints.length + 1,
    });

    return data;
  };

  const timelineData = buildTimelineData();

  return (
    <View style={{flex: 1, backgroundColor: '#0f0f0f'}}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Load All Images Button (Ghost) — Top Right */}
      <View style={timeline.loadAllButtonContainer}>
        <TouchableOpacity
          onPress={loadAllImages}
          style={timeline.loadAllButton}>
          <FontAwesome
            name="download"
            size={14}
            color="#10b981"
            style={{marginRight: 6}}
          />
          <Text style={timeline.loadAllButtonText}>Load All Images</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={rideRoutes.scrollView}
        contentContainerStyle={{paddingBottom: 40}}>
        {stopPointsLoading ? (
          <View style={feedback.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={feedback.loadingText}>Loading route...</Text>
          </View>
        ) : stopPointsError ? (
          <View style={feedback.errorContainer}>
            {stopPointsError === 'join_required' ? (
              <>
                <FontAwesome
                  name="lock"
                  size={36}
                  color="#f59e0b"
                  style={{marginBottom: 12}}
                />
                <Text
                  style={{
                    color: '#f59e0b',
                    fontSize: 16,
                    fontWeight: '700',
                    marginBottom: 6,
                    textAlign: 'center',
                  }}>
                  Join Required
                </Text>
                <Text
                  style={{
                    color: '#aaa',
                    textAlign: 'center',
                    fontSize: 13,
                    lineHeight: 20,
                  }}>
                  You need to join this ride to view the stop points.
                </Text>
              </>
            ) : (
              <>
                <Text style={{fontSize: 32, marginBottom: 12}}>⚠️</Text>
                <Text style={feedback.errorText}>{stopPointsError}</Text>
                <TouchableOpacity
                  onPress={fetchStopPoints}
                  style={{
                    marginTop: 16,
                    backgroundColor: '#ffffff',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 8,
                  }}>
                  <Text style={{color: '#fff', fontWeight: '600'}}>Retry</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : stopPoints.length === 0 ? (
          <View style={rideRoutes.emptyStopsContainer}>
            <Text style={rideRoutes.emptyStopsText}>
              No stops on this route
            </Text>
          </View>
        ) : (
          <View style={timeline.timelineContainer}>
            {/* Left: Connection line runs full height */}
            <View style={timeline.lineTrack} />

            {/* Right: Timeline content */}
            <View style={timeline.contentTrack}>
              {timelineData.map((item, idx) => (
                <View key={idx} style={timeline.timelineRow}>
                  {/* Left: Node */}
                  <View style={timeline.nodeColumn}>
                    <TimelineNode
                      type={item.type}
                      index={item.index}
                      isFirstNode={idx === 0}
                      isLastNode={idx === timelineData.length - 1}
                    />
                  </View>

                  {/* Right: Card */}
                  <TimelineStopCard
                    stopData={{
                      stopName: item.stopName,
                      distance: item.distance,
                      duration: item.duration,
                    }}
                    type={item.type}
                    stopIndex={item.type === 'STOP' ? item.index : null}
                    isFirstNode={idx === 0}
                    isLastNode={idx === timelineData.length - 1}
                    isExpanded={expandedIndex === idx}
                    onPress={() =>
                      setExpandedIndex(expandedIndex === idx ? null : idx)
                    }
                    images={stopPointImages[item.stopName]}
                    isLoadingImages={loadingImages[item.stopName]}
                    onLoadImages={() => fetchImagesForStop(item.stopName)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default RideRoutesPage;
