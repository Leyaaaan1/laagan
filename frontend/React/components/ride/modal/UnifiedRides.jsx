// ─────────────────────────────────────────────────────────────────────────────
// components/ride/modal/UnifiedRides.jsx
//
// Modal sheet — used for "My Rides" bottom sheet on RiderPage.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { fetchMyRides, fetchRides } from '../../../services/rideService';
import colors from '../../../styles/tokens/colors';
import text from '../../../styles/base/text';
import buttons from '../../../styles/base/buttons';
import RideCard from './RideCard';

const UnifiedRides = ({
                        visible,
                        onClose,
                        token,
                        onRideSelect,
                        mode = 'all',
                        pageSize = 10,
                      }) => {
  const [rides, setRides]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [page, setPage]             = useState(0);
  const [hasMore, setHasMore]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isMyRidesMode = mode === 'my';
  const title = isMyRidesMode ? 'My Rides' : 'All Rides';

  useEffect(() => {
    if (visible) loadRides(0, true);
  }, [visible, token, mode]);

  const loadRides = async (pageNum = 0, refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      if (refresh) setPage(0);
      else if (!hasMore) return;
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
  };

  const renderItem = ({ item }) => (
    <RideCard
      item={item}
      onPress={(ride) => { onClose(); onRideSelect?.(ride); }}
      variant="full"
      showCreator={!isMyRidesMode}
    />
  );

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 15,
          borderBottomWidth: 1,
          borderBottomColor: '#333',
        }}>
          <TouchableOpacity onPress={onClose} style={{ marginRight: 15 }}>
            <FontAwesome name="arrow-left" size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={[text.title, { fontSize: 20, flex: 1 }]}>{title}</Text>
          <Text style={[text.caption, { color: '#666' }]}>
            {rides.length} ride{rides.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {error ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <FontAwesome name="exclamation-triangle" size={32} color="red" style={{ marginBottom: 15 }} />
            <Text style={{ color: 'red', textAlign: 'center', marginBottom: 15 }}>{error}</Text>
            <TouchableOpacity
              style={[buttons.primary, { marginTop: 15 }]}
              onPress={() => loadRides(0, true)}
            >
              <Text style={buttons.textPrimary}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={rides}
            renderItem={renderItem}
            keyExtractor={(item) => item.generatedRidesId.toString()}
            ListEmptyComponent={loading && !refreshing ? null : renderEmpty}
            ListFooterComponent={renderFooter}
            contentContainerStyle={{ padding: 15 }}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => loadRides(0, true)}
            onEndReached={() => { if (!loading && hasMore) loadRides(page + 1); }}
            onEndReachedThreshold={0.5}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default UnifiedRides;