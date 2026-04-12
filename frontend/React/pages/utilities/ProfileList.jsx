// ─────────────────────────────────────────────────────────────────────────────
// pages/utilities/ProfileList.jsx
//
// Horizontal swipeable carousel of the user's rides.
// Uses FlatList horizontal — safe inside a vertical ScrollView because
// scroll directions are perpendicular (no gesture conflict).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../styles/tokens/colors';
import spacing from '../../styles/tokens/spacing';
import { fetchMyRides } from '../../services/rideService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH  = SCREEN_WIDTH * 0.72;
const CARD_GAP    = 12;

const getRideTypeIcon = (riderType) => {
  switch (riderType) {
    case 'car':         return 'car';
    case 'motor':
    case 'Motorcycle':  return 'motorcycle';
    case 'bike':
    case 'Bicycle':     return 'bicycle';
    case 'cafe Racers': return 'rocket';
    default:            return 'flag';
  }
};

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ── Single swipe card ─────────────────────────────────────────────────────────
// NOTE: onPress receives the raw ride item — the parent (RiderProfile)
// calls buildRideStep4Params with the correct currentUsername so isOwner
// is computed accurately. Do NOT build params here.
const RideSwipeCard = ({ item, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={() => onPress(item)}
    style={{
      width: CARD_WIDTH,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.md,
      marginRight: CARD_GAP,
      borderWidth: 1,
      borderColor: item.active ? colors.primary : colors.border,
      justifyContent: 'space-between',
      minHeight: 160,
    }}
  >
    {/* Top row: active badge + type icon */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <View style={{
        backgroundColor: item.active ? colors.primary : colors.surfaceDark,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}>
        <Text style={{
          color: item.active ? colors.white : colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {item.active ? 'Active' : 'Inactive'}
        </Text>
      </View>
      <FontAwesome
        name={getRideTypeIcon(item.riderType)}
        size={18}
        color={colors.primary}
      />
    </View>

    {/* Ride name */}
    <Text
      style={{
        color: colors.textPrimary,
        marginBottom: 6,
      }}
      numberOfLines={2}
    >
      {item.ridesName ?? '—'}
    </Text>

    {/* Location */}
    <Text
      style={{
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 10,
      }}
      numberOfLines={1}
    >
      {item.locationName ?? '—'}
    </Text>

    {/* Route: start → end */}
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
      <FontAwesome name="map-marker" size={11} color={colors.primary} />
      <Text style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
        {item.startingPointName ?? '—'}
      </Text>
      <FontAwesome name="long-arrow-right" size={10} color={colors.textMuted} />
      <Text style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
        {item.endingPointName ?? '—'}
      </Text>
    </View>

    {/* Bottom row: distance + date */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <FontAwesome name="road" size={10} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted }}>
          {item.distance != null ? `${item.distance} km` : '— km'}
        </Text>
      </View>
      {item.date && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <FontAwesome name="calendar" size={10} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted,  }}>
            {formatDate(item.date)}
          </Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

// ── Load more card (last item in the list) ────────────────────────────────────
const LoadMoreCard = ({ onPress, loading }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    disabled={loading}
    style={{
      width: CARD_WIDTH * 0.5,
      backgroundColor: colors.surfaceDark,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 160,
      marginRight: spacing.md,
    }}
  >
    {loading
      ? <ActivityIndicator size="small" color={colors.primary} />
      : (
        <>
          <FontAwesome name="plus-circle" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={{ color: colors.primary }}>
            More
          </Text>
        </>
      )
    }
  </TouchableOpacity>
);

// ── Dot pagination indicator ──────────────────────────────────────────────────
const DotIndicator = ({ total, active }) => {
  if (total <= 1) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
      {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 16 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === active ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
};

const ProfileList = ({ token, onRideSelect, currentUsername, pageSize = 6 }) => {
  const [rides, setRides]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState('');
  const [page, setPage]               = useState(0);
  const [hasMore, setHasMore]         = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const loadRides = useCallback(async (pageNum, replace = false) => {
    try {
      replace ? setLoading(true) : setLoadingMore(true);
      setError('');
      const result = await fetchMyRides( pageNum, pageSize);
      if (result?.content) {
        setRides(prev => replace ? result.content : [...prev, ...result.content]);
        setHasMore(!result.last);
        setPage(result.number);
      }
    } catch (err) {
      setError(err.message || 'Failed to load rides');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [ pageSize]);

  useEffect(() => { loadRides(0, true); }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <Text style={{ color: colors.error, textAlign: 'center', marginBottom: 12 }}>{error}</Text>
        <TouchableOpacity
          onPress={() => loadRides(0, true)}
          style={{ backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}
        >
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────
  if (!rides.length) {
    return (
      <View style={{ paddingVertical: 28, alignItems: 'center' }}>
        <FontAwesome name="road" size={36} color="#555" style={{ marginBottom: 10 }} />
        <Text style={{ color: colors.textMuted}}>No rides created yet</Text>
      </View>
    );
  }

  // Build data: rides + optional "load more" sentinel
  const listData = hasMore
    ? [...rides, { _loadMore: true, generatedRidesId: '__load_more__' }]
    : rides;

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={listData}
        keyExtractor={(item) => item.generatedRidesId.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: 4 }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => {
          if (item._loadMore) {
            return (
              <LoadMoreCard
                loading={loadingMore}
                onPress={() => loadRides(page + 1)}
              />
            );
          }
          return (
            <RideSwipeCard
              item={item}
              onPress={onRideSelect}
            />
          );
        }}
      />
      <DotIndicator total={rides.length} active={activeIndex} />
    </View>
  );
};

export default ProfileList;