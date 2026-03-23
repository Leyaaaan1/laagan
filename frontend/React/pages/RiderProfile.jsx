// ─────────────────────────────────────────────────────────────────────────────
// pages/RiderProfile.jsx  (rewritten — crash-proof)
//
// Rules applied everywhere:
//   • NO bare nullable inside <Text> — always String(x) or fallback
//   • NO {value} someText patterns — use template literals via String()
//   • NO optional chaining that returns undefined into JSX text nodes
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { getMyProfile }         from '../../React/services/profileService';
import { buildRideStep4Params } from '../utilities/NavigationParamsBuilder';
import profileStyles            from '../styles/screens/Profilestyles';
import ProfileList    from './utilities/ProfileList';
import SearchHeader        from '../pages/utilities/SearchHeader';

// ─── Safe string helper ───────────────────────────────────────────────────────
// Converts any value to a renderable string — never lets undefined/null leak.
const s = (val, fallback = '') =>
  val !== null && val !== undefined ? String(val) : fallback;

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ profilePictureUrl, displayName }) {
  const initial = displayName ? String(displayName)[0].toUpperCase() : '?';
  if (profilePictureUrl) {
    return (
      <Image
        source={{ uri: String(profilePictureUrl) }}
        style={profileStyles.avatarImage}
      />
    );
  }
  return (
    <Text style={profileStyles.avatarInitial}>{initial}</Text>
  );
}

// ─── Rider type badges ────────────────────────────────────────────────────────
function RiderTypeBadges({ riderTypes }) {
  if (!Array.isArray(riderTypes) || riderTypes.length === 0) return null;
  return (
    <View style={profileStyles.badgeRow}>
      {riderTypes.map((type, idx) => (
        <View key={String(type) + idx} style={profileStyles.badge}>
          <Text style={profileStyles.badgeText}>{s(type, 'Unknown')}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children, right }) {
  return (
    <View style={profileStyles.sectionCard}>
      <View style={[profileStyles.sectionHeader, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[profileStyles.sectionIndicator, { backgroundColor: '#cc0000' }]} />
          <Text style={profileStyles.sectionTitle}>{s(title)}</Text>
        </View>
        {right || null}
      </View>
      {children}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RiderProfile({ route, navigation }) {
  const token    = route?.params?.token    ?? null;
  const username = route?.params?.username ?? null;

  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const result = await getMyProfile(token);
      if (result && result.success) {
        setProfile(result.data ?? null);
      } else {
        setError(s(result?.message, 'Failed to load profile.'));
      }
    } catch (err) {
      setError(s(err?.message, 'Failed to load profile.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleRideSelect = (ride) => {
    if (!ride) return;
    // usernameStr is the logged-in user — compared against ride.username
    // inside buildRideStep4Params to correctly set isOwner + role
    const loggedInUsername = s(profile?.username, s(username));
    const params = buildRideStep4Params(ride, token, loggedInUsername);
    navigation.navigate('RideStep4', params);
  };

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={profileStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#cc0000" />
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={profileStyles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={40} color="#cc0000" style={{ marginBottom: 12 }} />
        <Text style={profileStyles.errorText}>{s(error, 'Something went wrong.')}</Text>
        <TouchableOpacity
          onPress={loadProfile}
          style={{
            marginTop: 12,
            backgroundColor: '#cc0000',
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>{'Retry'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Safe profile values — extracted BEFORE render, never nullable ──────
  const displayName = s(profile?.displayName || profile?.username, 'Rider');
  const usernameStr = s(profile?.username, '');
  const bioStr      = s(profile?.bio, '');
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    : null;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <View style={profileStyles.screen}>
      <ScrollView
        contentContainerStyle={profileStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#cc0000"
          />
        }
      >
        {/* ── Red hero banner ── */}
        <View style={profileStyles.heroBanner} />

        {/* ── Avatar (overlaps banner) ── */}
        <View style={profileStyles.avatarWrapper}>
          <View style={profileStyles.avatarCircle}>
            <Avatar
              profilePictureUrl={profile?.profilePictureUrl ?? null}
              displayName={displayName}
            />
          </View>
        </View>

        {/* ── Name / username / badges ── */}
        <View style={profileStyles.profileHeaderCard}>
          <Text style={profileStyles.displayName} numberOfLines={1}>
            {displayName}
          </Text>

          {usernameStr.length > 0 && (
            <Text style={profileStyles.username}>
              {'@' + usernameStr}
            </Text>
          )}

          <RiderTypeBadges riderTypes={profile?.riderTypes} />
        </View>

        {/* ── Bio ── */}
        <SectionCard title="About">
          <Text style={bioStr ? profileStyles.bioText : profileStyles.bioEmpty}>
            {bioStr || 'No bio yet.'}
          </Text>
        </SectionCard>

        {/* ── Member since ── */}
        {memberSince !== null && (
          <Text style={profileStyles.timestamp}>
            {'Member since ' + memberSince}
          </Text>
        )}

        {/* ── My Rides ── */}
        <SectionCard
          title="My Rides"
          right={
            <SearchHeader
              token={token}
              username={usernameStr}
              navigation={navigation}
            />
          }
        >
          <ProfileList
            token={token}
            currentUsername={usernameStr}
            onRideSelect={handleRideSelect}
            pageSize={5}
          />
        </SectionCard>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}