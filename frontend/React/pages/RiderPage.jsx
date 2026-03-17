import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';

import FontAwesome from 'react-native-vector-icons/FontAwesome';

import SearchHeader from '../components/ride/utilities/SearchHeader';
import { getActiveRide } from '../services/startService';
import ScannerHeader from '../components/ride/utilities/SqannerHeader';
import UnifiedRidesModal from '../components/ride/modal/UnifiedRidesModal';
import InlineRidesList from '../components/ride/modal/InlineRidesList';
import layout from '../styles/base/layout';
import header from '../styles/base/header';
import badges from '../styles/base/badges';
import buttons from '../styles/base/buttons';

const getRideTypeIcon = (type) => {
  switch (type) {
    case 'car':         return 'car';
    case 'motor':
    case 'Motorcycle':  return 'motorcycle';
    case 'bike':
    case 'Bicycle':     return 'bicycle';
    case 'cafe Racers': return 'rocket';
    default:            return 'user';
  }
};

const RiderPage = ({ route, navigation }) => {
  const { username, token } = route.params;

  const [riderType, setRiderType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myRidesModalVisible, setMyRidesModalVisible] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [activeRideLoading, setActiveRideLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setActiveRideLoading(true);
        const result = await getActiveRide(token);
        if (!cancelled) setActiveRide(result);
      } catch (error) {
        if (!cancelled) setActiveRide(null);
      } finally {
        if (!cancelled) setActiveRideLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [token]);

  const handleRideSelect = (ride) => {
    navigation.navigate('RideStep4', {
      generatedRidesId: ride.generatedRidesId,
      rideName: ride.ridesName,
      locationName: ride.locationName,
      riderType: ride.riderType,
      distance: ride.distance,
      date: ride.date,
      participants: ride.participants,
      description: ride.description,
      token,
      username: ride.username,
      currentUsername: username,
    });
  };

  const handleCreateRide = () => {
    navigation.navigate('CreateRide', { token, username });
  };

  return (
    <View style={layout.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#151515" />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
      }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <View style={header.avatar}>
            <FontAwesome name="user" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[header.username, { flexShrink: 1 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {username?.toUpperCase()}
            </Text>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" style={{ marginTop: 4 }} />
            ) : (
              <View style={badges.riderTypeBadge}>
                <FontAwesome
                  name={getRideTypeIcon(riderType?.riderType)}
                  size={12}
                  color="#fff"
                  style={{ marginRight: 5 }}
                />
                <Text style={badges.riderTypeText}>
                  {riderType?.riderType}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SearchHeader token={token} username={username} navigation={navigation} />
          <ScannerHeader token={token} username={username} navigation={navigation} />
        </View>
      </View>

      {/* Active Ride */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (!activeRide) { return; }
          navigation.navigate('StartedRide', { activeRide, token, username });
        }}
        style={{ marginHorizontal: 16, marginVertical: 8, backgroundColor: '#1e1e1e', borderRadius: 8, padding: 12 }}
      >
        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Active Ride</Text>
        {activeRideLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : activeRide ? (
          <View>
            <Text style={{ color: '#fff', fontSize: 14 }}>{activeRide.ridesName}</Text>
            <View style={{ flexDirection: 'row', marginTop: 4, justifyContent: 'space-between' }}>
              <Text style={{ color: '#888', fontSize: 12 }}>{activeRide.locationName}</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>{activeRide.riderType}</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>{activeRide.distance} km</Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: '#666', fontSize: 14 }}>No active ride</Text>
        )}
      </TouchableOpacity>

      {/* Create Ride Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleCreateRide}
        style={{
          marginHorizontal: 16,
          marginBottom: 10,
          backgroundColor: '#8c2323',
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <FontAwesome name="plus" size={14} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
          Create Ride
        </Text>
      </TouchableOpacity>

      {/* Rides List */}
      <View style={{ flex: 1 }}>
        <InlineRidesList
          token={token}
          onRideSelect={handleRideSelect}
          mode="all"
          pageSize={10}
        />
      </View>

      {/* My Rides Button */}
      <View style={layout.bottomContainer}>
        <TouchableOpacity
          style={buttons.pill}
          onPress={() => setMyRidesModalVisible(true)}
        >
          <Text style={buttons.textPrimary}>My Rides</Text>
        </TouchableOpacity>
      </View>

      {/* My Rides Modal */}
      <UnifiedRidesModal
        visible={myRidesModalVisible}
        onClose={() => setMyRidesModalVisible(false)}
        token={token}
        onRideSelect={handleRideSelect}
        mode="my"
        pageSize={10}
      />
    </View>
  );
};

export default RiderPage;