import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {getMyProfile} from '../services/profileService';
import {authService} from '../services/authService';
import {buildRideStep4Params} from '../utilities/NavigationParamsBuilder';
import profileStyles from '../styles/screens/Profilestyles';
import ProfileList from './utilities/ProfileList';
import SearchHeader from '../pages/utilities/SearchHeader';
import {useAuth} from '../context/AuthContext';

const s = (val, fallback = '') =>
  val !== null && val !== undefined ? String(val) : fallback;

function Avatar({profilePictureUrl, displayName}) {
  const initial = displayName ? String(displayName)[0].toUpperCase() : '?';
  if (profilePictureUrl) {
    return (
      <Image
        source={{uri: String(profilePictureUrl)}}
        style={profileStyles.avatarImage}
      />
    );
  }
  return <Text style={profileStyles.avatarInitial}>{initial}</Text>;
}

function RiderTypeBadges({riderTypes}) {
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

function SectionCard({title, children, right}) {
  return (
    <View style={profileStyles.sectionCard}>
      <View
        style={[
          profileStyles.sectionHeader,
          {justifyContent: 'space-between'},
        ]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={[
              profileStyles.sectionIndicator,
              {backgroundColor: '#cc0000'},
            ]}
          />
          <Text style={profileStyles.sectionTitle}>{s(title)}</Text>
        </View>
        {right || null}
      </View>
      {children}
    </View>
  );
}

export default function RiderProfile({route, navigation}) {
  const {username: authUsername, token, logout} = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const result = await getMyProfile(); // auto-reads token
      if (result?.success) {
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
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleRideSelect = ride => {
    if (!ride) return;
    const loggedInUsername = s(profile?.username, s(authUsername));
    // buildRideStep4Params takes (rideData, currentUsername) — 2 args only
    const params = buildRideStep4Params(ride, loggedInUsername);
    navigation.navigate('RideStep4', params);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            if (token) {
              await authService.logout(token);
            }
            await logout();
            navigation.navigate('AuthScreen');
          } catch (err) {
            Alert.alert('Error', 'Logout failed');
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={profileStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#cc0000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={profileStyles.errorContainer}>
        <FontAwesome
          name="exclamation-circle"
          size={40}
          color="#cc0000"
          style={{marginBottom: 12}}
        />
        <Text style={profileStyles.errorText}>
          {s(error, 'Something went wrong.')}
        </Text>
        <TouchableOpacity
          onPress={loadProfile}
          style={{
            marginTop: 12,
            backgroundColor: '#cc0000',
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 8,
          }}>
          <Text style={{color: '#fff', fontWeight: '600'}}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = s(profile?.displayName || profile?.username, 'Rider');
  const usernameStr = s(profile?.username, '');
  const bioStr = s(profile?.bio, '');
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

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
        }>
        <View style={profileStyles.heroBanner} />

        <View style={profileStyles.avatarWrapper}>
          <View style={profileStyles.avatarCircle}>
            <Avatar
              profilePictureUrl={profile?.profilePictureUrl ?? null}
              displayName={displayName}
            />
          </View>
        </View>

        <View style={profileStyles.profileHeaderCard}>
          <Text style={profileStyles.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          {usernameStr.length > 0 && (
            <Text style={profileStyles.username}>{'@' + usernameStr}</Text>
          )}
          <RiderTypeBadges riderTypes={profile?.riderTypes} />
        </View>

        <SectionCard title="About">
          <Text style={bioStr ? profileStyles.bioText : profileStyles.bioEmpty}>
            {bioStr || 'No bio yet.'}
          </Text>
        </SectionCard>

        {memberSince !== null && (
          <Text style={profileStyles.timestamp}>
            {'Member since ' + memberSince}
          </Text>
        )}

        <SectionCard
          title="My Rides"
          right={
            <SearchHeader username={usernameStr} navigation={navigation} />
          }>
          <ProfileList
            currentUsername={usernameStr}
            onRideSelect={handleRideSelect}
            pageSize={5}
          />
        </SectionCard>

        {/* ✅ NEW: Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loggingOut}
          style={{
            marginHorizontal: 16,
            marginVertical: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: '#8c2323',
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loggingOut ? 0.6 : 1,
          }}>
          {loggingOut ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <FontAwesome name="sign-out" size={16} color="#fff" />
              <Text
                style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: '600',
                  marginLeft: 8,
                }}>
                Logout
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{height: 32}} />
      </ScrollView>
    </View>
  );
}
