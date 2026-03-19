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
import { getMyProfile } from '../services/profileService';
import profileStyles from '../styles/screens/Profilestyles';
import ProfileRidesList from './utilities/ProfileList';
import SearchHeader from './utilities/SearchHeader';


function Avatar({ profilePictureUrl, displayName }) {
  const initial = displayName ? displayName[0].toUpperCase() : '?';
  return (
    <View style={profileStyles.avatarCircle}>
      {profilePictureUrl ? (
        <Image source={{ uri: profilePictureUrl }} style={profileStyles.avatarImage} />
      ) : (
        <Text style={profileStyles.avatarInitial}>{initial}</Text>
      )}
    </View>
  );
}

function RiderTypeBadges({ riderTypes = [] }) {
  if (!riderTypes.length) return null;
  return (
    <View style={profileStyles.badgeRow}>
      {riderTypes.map((type) => (
        <View key={type} style={profileStyles.badge}>
          <Text style={profileStyles.badgeText}>{type}</Text>
        </View>
      ))}
    </View>
  );
}

function SectionCard({ title, children, right }) {
  return (
    <View style={profileStyles.sectionCard}>
      <View style={[profileStyles.sectionHeader, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={profileStyles.sectionIndicator} />
          <Text style={profileStyles.sectionTitle}>{title}</Text>
        </View>
        {right && <View>{right}</View>}
      </View>
      {children}
    </View>
  );
}

function InfoRow({ label, value, isLast }) {
  return (
    <View style={[profileStyles.infoRow, isLast && profileStyles.infoRowLast]}>
      <Text style={profileStyles.infoLabel}>{label}</Text>
      <Text style={value ? profileStyles.infoValue : profileStyles.infoValueMuted}>
        {value || '—'}
      </Text>
    </View>
  );
}


export default function RiderProfile({ route, navigation }) {
  const { token } = route.params;   // ← token passed from RiderPage

  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const result = await getMyProfile(token);   // ← pass token
      if (result.success) {
        setProfile(result.data);                  // ← read from result.data
      } else {
        setError(result.message || 'Failed to load profile.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
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
        <Text style={profileStyles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadProfile}>
          <Text style={{ color: '#cc0000', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    : null;

  return (
    <View style={profileStyles.screen}>
      <ScrollView
        contentContainerStyle={profileStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#cc0000" />
        }
      >
        {/* Red hero banner */}
        <View style={profileStyles.heroBanner} />

        {/* Avatar */}
        <View style={profileStyles.avatarWrapper}>
          <Avatar
            profilePictureUrl={profile?.profilePictureUrl}
            displayName={profile?.displayName || profile?.username}
          />
        </View>

        {/* Name + username + badges */}
        <View style={profileStyles.profileHeaderCard}>
          <Text style={profileStyles.displayName}>
            {profile?.displayName || profile?.username}
          </Text>

          <Text style={profileStyles.username}>@{profile?.username}</Text>
          <RiderTypeBadges riderTypes={profile?.riderTypes} />

        </View>

        {/* Bio */}
        <SectionCard title="About">
          <Text style={profile?.bio ? profileStyles.bioText : profileStyles.bioEmpty}>
            {profile?.bio || 'No bio yet.'}
          </Text>
        </SectionCard>

        {/* Contact */}


        {formattedDate && (
          <Text style={profileStyles.timestamp}>Member since {formattedDate}</Text>
        )}



        {/* My Rides */}
        <SectionCard
          title="My Rides"
          right={
            <SearchHeader
              token={token}
              username={profile?.username}
              navigation={navigation}
            />
          }
        >
          <ProfileRidesList
            token={token}
            onRideSelect={(ride) =>
              navigation?.navigate('RideStep4', {
                generatedRidesId: ride.generatedRidesId,
                rideName:         ride.ridesName,
                locationName:     ride.locationName,
                riderType:        ride.riderType,
                distance:         ride.distance,
                date:             ride.date,
                token,
              })
            }
            pageSize={5}
          />
        </SectionCard>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}