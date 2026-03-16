import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';

import { fetchRides, fetchMyRides } from '../../../services/rideService';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import rideCard from '../../../styles/components/rideCard';
import badges from '../../../styles/base/badges';
import colors from '../../../styles/tokens/colors';

const getRideTypeIcon = (riderType) => {
  switch (riderType) {
    case 'car':         return 'car';
    case 'motor':
    case 'Motorcycle':  return 'motorcycle';
    case 'bike':
    case 'Bicycle':     return 'bicycle';
    case 'cafe Racers': return 'rocket';
    default:            return 'user';
  }
};

const formatDate = (date) => {
  if (!date) { return null; }
  return new Date(date).toLocaleString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Extracted to avoid re-creating on every render of the list
const RideItem = ({ item, onPress, isMyRidesMode }) => (
  <TouchableWithoutFeedback onPress={() => onPress(item)}>
    <View style={rideCard.container}>

      {/* Location */}
      <Text style={rideCard.locationName}>
        {item.locationName.toUpperCase()}
      </Text>

      {/* ID + Active badge */}
      <View style={rideCard.idRow}>
        <Text style={rideCard.idText}>
          ID: #{item.generatedRidesId}
        </Text>
        {item.active === false && (
          <View style={badges.inactive}>
            <Text style={badges.inactiveText}>INACTIVE</Text>
          </View>
        )}
      </View>

      {/* Ride name + type + distance */}
      <View style={rideCard.nameRow}>
        <Text style={rideCard.rideName}>
          {item.ridesName}
        </Text>
        <View style={rideCard.typeRow}>
          <FontAwesome name={getRideTypeIcon(item.riderType)} size={16} color={colors.primary} style={{ marginRight: 5 }} />
          <Text style={rideCard.distanceText}>
            {item.distance} km
          </Text>
        </View>
      </View>

      {/* Route */}
      <View style={rideCard.routeRow}>
        <FontAwesome name="map-marker" size={14} color={colors.primary} />
        <Text style={rideCard.routePointText}>
          {item.startingPointName}
        </Text>
        <FontAwesome name="arrow-right" size={12} color="#fff" style={{ marginHorizontal: 8 }} />
        <Text style={rideCard.routePointText}>
          {item.endingPointName}
        </Text>
      </View>

      {/* Date */}
      {item.date && (
        <Text style={rideCard.dateText}>
          <FontAwesome name="calendar" size={12} color="#aaa" />{' '}
          {formatDate(item.date)}
        </Text>
      )}

      {/* Creator — only in "all" mode */}
      {!isMyRidesMode && (
        <View style={rideCard.creatorRow}>
          <FontAwesome name="user-circle" size={14} color="#666" />
          <Text style={rideCard.creatorText}>
            Created by {item.username}
          </Text>
        </View>
      )}

      {/* Map Image */}
      {item.mapImageUrl && (
        <Image
          source={{ uri: item.mapImageUrl }}
          style={rideCard.mapImage}
          resizeMode="cover"
        />
      )}

      {/* Description */}
      {item.description && (
        <Text style={rideCard.description}>
          {item.description}
        </Text>
      )}

    </View>
  </TouchableWithoutFeedback>
);
const InlineRidesList = ({ token, onRideSelect, mode = 'all', pageSize = 10 }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isMyRidesMode = mode === 'my';

  const loadRides = useCallback(async (pageNum, refresh = false) => {
    // Guard: don't load more if there's nothing left
    if (!refresh && !hasMore) { return; }

    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');

      const result = isMyRidesMode
        ? await fetchMyRides(token, pageNum, pageSize)
        : await fetchRides(token, pageNum, pageSize);

      if (result?.content) {
        setRides(prev => refresh ? result.content : [...prev, ...result.content]);
        setHasMore(!result.last);
        setPage(result.number);
      }
    } catch (err) {
      console.error('Error loading rides:', err);
      setError(err.message || 'Failed to load rides');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, mode, hasMore, isMyRidesMode, pageSize]);

  useEffect(() => {
    loadRides(0, true);
  }, [token, mode]);

  const handleRefresh = useCallback(() => loadRides(0, true), [token, mode]);
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) { loadRides(page + 1); }
  }, [loading, hasMore, page]);

  const renderRideItem = useCallback(({ item }) => (
    <RideItem item={item} onPress={onRideSelect} isMyRidesMode={isMyRidesMode} />
  ), [onRideSelect, isMyRidesMode]);

  const renderEmpty = () => (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <FontAwesome name="road" size={48} color="#666" style={{ marginBottom: 15 }} />
      <Text style={{ color: '#ddd', fontSize: 16 }}>
        {isMyRidesMode ? "You haven't created any rides yet" : 'No rides available'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || refreshing) { return null; }
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if (error) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <FontAwesome name="exclamation-triangle" size={32} color="red" style={{ marginBottom: 15 }} />
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 15 }}>{error}</Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
          onPress={handleRefresh}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={rides}
      renderItem={renderRideItem}
      keyExtractor={(item) => item.generatedRidesId.toString()}
      ListEmptyComponent={loading && !refreshing ? null : renderEmpty}
      ListFooterComponent={renderFooter}
      contentContainerStyle={{ padding: 15 }}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      // Perf: avoid re-rendering items that haven't changed
      removeClippedSubviews={true}
      maxToRenderPerBatch={8}
      windowSize={10}
      initialNumToRender={6}
    />
  );
};

export default InlineRidesList;