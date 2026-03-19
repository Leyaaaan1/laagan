// ─────────────────────────────────────────────────────────────────────────────
// components/ride/modal/RidesList.jsx
//
// Used by RiderPage — FlatList with pull-to-refresh and infinite scroll.
// mode="all"  → fetchRides   (GET /rides)
// mode="my"   → fetchMyRides (GET /my-rides)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { fetchRides, fetchMyRides } from '../../../services/rideService';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../../styles/tokens/colors';
import RideCard from './RideCard';

const RidesList = ({ token, onRideSelect, mode = 'all', pageSize = 10 }) => {
  const [rides, setRides]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(0);
  const [hasMore, setHasMore]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isMyRidesMode = mode === 'my';

  const loadRides = useCallback(async (pageNum, refresh = false) => {
    if (!refresh && !hasMore) return;
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
      setError(err.message || 'Failed to load rides');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, mode, hasMore, isMyRidesMode, pageSize]);

  useEffect(() => { loadRides(0, true); }, [token, mode]);

  const handleRefresh  = useCallback(() => loadRides(0, true), [token, mode]);
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) loadRides(page + 1);
  }, [loading, hasMore, page]);

  const renderItem = useCallback(({ item }) => (
    <RideCard
      item={item}
      onPress={onRideSelect}
      variant="full"
      showCreator={!isMyRidesMode}
    />
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
    if (!loading || refreshing) return null;
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
      renderItem={renderItem}
      keyExtractor={(item) => item.generatedRidesId.toString()}
      ListEmptyComponent={loading && !refreshing ? null : renderEmpty}
      ListFooterComponent={renderFooter}
      contentContainerStyle={{ padding: 15 }}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      removeClippedSubviews={true}
      maxToRenderPerBatch={8}
      windowSize={10}
      initialNumToRender={6}
    />
  );
};

export default RidesList;