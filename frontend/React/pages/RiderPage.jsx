import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';

import FontAwesome from 'react-native-vector-icons/FontAwesome';

import SearchHeader from './utilities/SearchHeader';
import { getActiveRide } from '../services/startService';
import ScannerHeader from './utilities/ScannerHeader';
import RidesList from '../components/ride/modal/RidesList';
import layout from '../styles/base/layout';
import header from '../styles/base/header';
import badges from '../styles/base/badges';
import { getMyProfile } from '../services/profileService';
import colors from '../styles/tokens/colors';
import { getRideTypeIcon } from '../utilities/rideTypes';


const ProfileAvatar = ({ profile, avatarStyle }) => {
  if (profile?.profilePictureUrl) {
    return (
      <Image
        source={{ uri: profile.profilePictureUrl }}
        style={[avatarStyle, { borderRadius: avatarStyle.borderRadius ?? 25 }]}
        resizeMode="cover"
      />
    );
  }

  const initial = (profile?.displayName || profile?.username || '');
  if (initial) {
    return (
      <Text style={{ color: '#cc0000', fontSize: 18, fontWeight: '700' }}>
        {initial[0].toUpperCase()}
      </Text>
    );
  }

  return <FontAwesome name="user" size={20} color="#fff" />;
};

const RiderPage = ({ route, navigation }) => {
  const { username, token } = route.params;

  const [loading, setLoading]               = useState(true);
  const [profile, setProfile]               = useState(null);
  const [activeRide, setActiveRide]         = useState(null);
  const [activeRideLoading, setActiveRideLoading]     = useState(false);

  // ── Fetch active ride ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setActiveRideLoading(true);
        const result = await getActiveRide(token);
        if (!cancelled) setActiveRide(result);
      } catch {
        if (!cancelled) setActiveRide(null);
      } finally {
        if (!cancelled) setActiveRideLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [token]);

  // ── Fetch rider profile ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const result = await getMyProfile(token);   // ← pass token
        if (!cancelled && result.success) {
          setProfile(result.data);                  // ← read from result.data
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [token]);

  const handleRideSelect = (ride) => {
    navigation.navigate('RideStep4', {
      generatedRidesId: ride.generatedRidesId,
      rideName:         ride.ridesName,
      locationName:     ride.locationName,
      riderType:        ride.riderType,
      distance:         ride.distance,
      date:             ride.date,
      participants:     ride.participants,
      description:      ride.description,
      token,
      username:         ride.username,
      currentUsername:  username,
    });
  };

  const handleCreateRide = () => {
    navigation.navigate('CreateRide', { token, username });
  };

  // riderType comes from profile now (already seeded by backend)
  const riderType = profile?.riderTypes?.[0] ?? null;

  return (
    <View style={layout.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#151515" />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 5,
      }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>

          {/* Avatar — tap to open profile */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RiderProfile', { token })}
            style={header.avatar}
          >
            <ProfileAvatar profile={profile} avatarStyle={header.avatar} />
          </TouchableOpacity>

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
                  name={getRideTypeIcon(riderType)}
                  size={12}
                  color="#fff"
                  style={{ marginRight: 5 }}
                />
                <Text style={badges.riderTypeText}>
                  {riderType ?? 'No type'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <SearchHeader  token={token} username={username} navigation={navigation} />
          <ScannerHeader token={token} username={username} navigation={navigation} />

          <TouchableOpacity activeOpacity={0.8} onPress={handleCreateRide}  style={{
            backgroundColor: colors.primary,
            padding: 8,
            borderRadius: 5,
          }}>
            <FontAwesome name="plus" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Ride */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (!activeRide) return;
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

      {/* Rides List */}
      <View style={{ flex: 1 }}>
        <RidesList
          token={token}
          onRideSelect={handleRideSelect}
          mode="all"
          pageSize={10}
        />
      </View>


    </View>
  );
};

export default RiderPage;