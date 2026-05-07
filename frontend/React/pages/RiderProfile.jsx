
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
  TextInput,
  Modal,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {getMyProfile} from '../services/profileService';
import {updateProfile, addRiderType, removeRiderType} from '../services/profileService';
import {authService} from '../services/authService';
import {buildRideStep4Params} from '../utilities/NavigationParamsBuilder';
import profileStyles from '../styles/screens/Profilestyles';
import buttons from '../styles/base/buttons';
import inputs from '../styles/base/inputs';
import colors from '../styles/tokens/colors';
import spacing from '../styles/tokens/spacing';
import {fontSize, fontWeight} from '../styles/tokens/typography';
import ProfileList from './utilities/ProfileList';
import SearchHeader from '../pages/utilities/SearchHeader';
import {useAuth} from '../context/AuthContext';
import RideTypeSelector from '../commons/RideTypeSelector';

const s = (val, fallback = '') =>
  val !== null && val !== undefined ? String(val) : fallback;

function Avatar({profilePictureUrl, displayName}) {
  const initial = displayName ? String(displayName)[0].toUpperCase() : '?';
  if (profilePictureUrl) {
    return (
      <Image        source={{uri: String(profilePictureUrl)}}        style={profileStyles.avatarImage}      />
    );
  }
  return <Text style={profileStyles.avatarInitial}>{initial}</Text>;
}

function RiderTypeBadges({riderTypes, onRemove}) {
  if (!Array.isArray(riderTypes) || riderTypes.length === 0) return null;
  return (
    <View style={profileStyles.badgeRow}>
      {riderTypes.map((type, idx) => (
        <View key={String(type) + idx} style={profileStyles.badge}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Text style={profileStyles.badgeText}>{s(type, 'Unknown')}</Text>
            {onRemove && (
              <TouchableOpacity                onPress={() => onRemove(type)}                style={{padding: 2}}>
                <FontAwesome name="times" size={10} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

function SectionCard({title, children, right}) {
  return (
    <View style={profileStyles.sectionCard}>
      <View        style={[
        profileStyles.sectionHeader,
        {justifyContent: 'space-between'},
      ]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View            style={[
            profileStyles.sectionIndicator,
          ]}          />
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

  // Edit modal states
  const [editModal, setEditModal] = useState({visible: false, field: null});
  const [editValues, setEditValues] = useState({
    displayName: '',
    bio: '',
    profilePictureUrl: '',
    riderTypes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingType, setIsRemovingType] = useState(false);
  const [isAddingType, setIsAddingType] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const result = await getMyProfile();
      if (result?.success) {
        setProfile(result.data ?? null);
        setEditValues({
          displayName: result.data?.displayName || '',
          bio: result.data?.bio || '',
          profilePictureUrl: result.data?.profilePictureUrl || '',
          riderTypes: '',
        });
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

  const openEditModal = field => {
    setEditModal({visible: true, field});
  };

  const closeEditModal = () => {
    setEditModal({visible: false, field: null});
    setEditValues({...editValues, riderTypes: ''});
  };

  const handleSaveEdit = async () => {
    const {field} = editModal;
    if (!field) return;

    setIsSaving(true);
    try {
      const updates = {[field]: editValues[field]};
      const result = await updateProfile(updates);

      if (result?.success) {
        setProfile(result.data);
        closeEditModal();
        Alert.alert('Success', `${field} updated successfully!`);
      } else {
        Alert.alert('Error', result?.message || 'Failed to update profile');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRiderType = async () => {
    const typeName = editValues.riderTypes;
    if (!typeName || typeName.trim() === '') {
      Alert.alert('Error', 'Please select a bike type');
      return;
    }

    setIsAddingType(true);
    try {
      const result = await addRiderType(typeName);

      if (result?.success) {
        setProfile(result.data);
        setEditValues({...editValues, riderTypes: ''});
        Alert.alert('Success', `${typeName} added to your bikes!`);
      } else {
        Alert.alert('Error', result?.message || 'Failed to add bike type');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add bike type');
    } finally {
      setIsAddingType(false);
    }
  };

  const handleRemoveRiderType = async typeName => {
    Alert.alert('Remove Bike', `Remove ${typeName} from your bikes?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setIsRemovingType(true);
          try {
            const result = await removeRiderType(typeName);

            if (result?.success) {
              setProfile(result.data);
              Alert.alert('Success', `${typeName} removed from your bikes!`);
            } else {
              Alert.alert(
                'Error',
                result?.message || 'Failed to remove bike type',
              );
            }
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to remove bike type');
          } finally {
            setIsRemovingType(false);
          }
        },
      },
    ]);
  };

  const handleRideSelect = ride => {
    if (!ride) return;
    const loggedInUsername = s(profile?.username, s(authUsername));
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={profileStyles.errorContainer}>
        <FontAwesome          name="exclamation-circle"          size={40}          color={colors.error}          style={{marginBottom: spacing.md}}        />
        <Text style={profileStyles.errorText}>
          {s(error, 'Something went wrong.')}
        </Text>
        <TouchableOpacity          onPress={loadProfile}          style={[buttons.primary, {marginTop: spacing.md}]}>
          <Text style={buttons.textPrimary}>Retry</Text>
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
      <ScrollView        contentContainerStyle={profileStyles.scrollContent}        refreshControl={
        <RefreshControl            refreshing={refreshing}            onRefresh={onRefresh}            tintColor={colors.primary}          />
      }>
        <View style={profileStyles.heroBanner} />

        <View style={profileStyles.avatarWrapper}>
          <View style={profileStyles.avatarCircle}>
            <Avatar              profilePictureUrl={profile?.profilePictureUrl ?? null}              displayName={displayName}            />
          </View>
        </View>

        <View style={profileStyles.profileHeaderCard}>
          <View            style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
          }}>
            <Text style={profileStyles.displayName} numberOfLines={1}>
              {displayName}
            </Text>
            <TouchableOpacity              onPress={() => openEditModal('displayName')}              style={[buttons.ghost, {marginLeft: spacing.sm}]}>
              <FontAwesome name="edit" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          {usernameStr.length > 0 && (
            <Text style={profileStyles.username}>{'@' + usernameStr}</Text>
          )}
        </View>

        <SectionCard title="About">
          <View            style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}>
            <Text              style={{
              flex: 1,
              ...(bioStr ? profileStyles.bioText : profileStyles.bioEmpty),
            }}>
              {bioStr || 'No bio yet.'}
            </Text>
            <TouchableOpacity              onPress={() => openEditModal('bio')}              style={[buttons.ghost, {marginLeft: spacing.md}]}>
              <FontAwesome name="edit" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </SectionCard>

        {/* ── Bike Types Section ── */}
        <SectionCard          title="My Bikes"          right={
          <TouchableOpacity              onPress={() => openEditModal('riderTypes')}              style={[buttons.ghost, {marginLeft: spacing.sm}]}>
            <FontAwesome name="plus" size={16} color={colors.primary} />
          </TouchableOpacity>
        }>
          <View style={{paddingHorizontal: spacing.md, paddingVertical: spacing.sm}}>
            {profile?.riderTypes && profile.riderTypes.length > 0 ? (
              <RiderTypeBadges                riderTypes={profile.riderTypes}                onRemove={handleRemoveRiderType}              />
            ) : (
              <Text style={profileStyles.bioEmpty}>No bikes added yet.</Text>
            )}
          </View>
        </SectionCard>

        {memberSince !== null && (
          <Text style={profileStyles.timestamp}>
            {'Member since ' + memberSince}
          </Text>
        )}

        <SectionCard          title="My Rides"          right={
          <SearchHeader username={usernameStr} navigation={navigation} />
        }>
          <ProfileList            currentUsername={usernameStr}            onRideSelect={handleRideSelect}            pageSize={5}          />
        </SectionCard>

        <TouchableOpacity          onPress={handleLogout}          disabled={loggingOut}          style={[
          buttons.primary,
          {
            marginHorizontal: spacing.md,
            marginVertical: spacing.md,
            backgroundColor: colors.error,
            opacity: loggingOut ? 0.6 : 1,
          },
        ]}>
          {loggingOut ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <View              style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}>
              <FontAwesome name="sign-out" size={16} color={colors.white} />
              <Text style={buttons.textPrimary}>Logout</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{height: spacing.lg * 2}} />
      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────────
          EDIT MODAL
          ───────────────────────────────────────────────────────────────── */}
      <Modal        visible={editModal.visible}        transparent        animationType="slide"        onRequestClose={closeEditModal}>
        <View          style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        }}>
          <View            style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.lg,
            paddingBottom: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
            <View              style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.lg,
            }}>
              <Text                style={{
                fontSize: fontSize.lg,
                fontWeight: fontWeight.bold,
                color: colors.textPrimary,
              }}>
                Edit {editModal.field}
              </Text>
              <TouchableOpacity onPress={closeEditModal}>
                <FontAwesome                  name="close"                  size={20}                  color={colors.textPrimary}                />
              </TouchableOpacity>
            </View>

            {editModal.field === 'bio' ? (
              <TextInput                style={[inputs.multiline, {marginBottom: spacing.lg}]}                placeholder={`Enter your ${editModal.field}...`}                placeholderTextColor={colors.textMuted}                multiline                value={editValues[editModal.field]}                onChangeText={text => {
                setEditValues({...editValues, [editModal.field]: text});
              }}              />
            ) : editModal.field === 'riderTypes' ? (
              <View style={{marginBottom: spacing.lg}}>
                <RideTypeSelector                  selectedType={editValues.riderTypes}                  onSelectType={type => {
                  setEditValues({...editValues, riderTypes: type});
                }}                />
              </View>
            ) : (
              <TextInput                style={[inputs.light, {marginBottom: spacing.lg}]}                placeholder={`Enter your ${editModal.field}...`}                placeholderTextColor={colors.textMuted}                value={editValues[editModal.field]}                onChangeText={text => {
                setEditValues({...editValues, [editModal.field]: text});
              }}              />
            )}

            <View style={{flexDirection: 'row', gap: spacing.md}}>
              <TouchableOpacity                onPress={closeEditModal}                style={[buttons.outline, {flex: 1}]}>
                <Text style={[buttons.textPrimary, {color: colors.primary}]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity                onPress={
                editModal.field === 'riderTypes'
                  ? handleAddRiderType
                  : handleSaveEdit
              }                disabled={
                editModal.field === 'riderTypes' ? isAddingType : isSaving
              }                style={[
                buttons.primary,
                {
                  flex: 1,
                  opacity:
                    editModal.field === 'riderTypes'
                      ? isAddingType
                        ? 0.6
                        : 1
                      : isSaving
                        ? 0.6
                        : 1,
                },
              ]}>
                {editModal.field === 'riderTypes' ? (
                  isAddingType ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={buttons.textPrimary}>Add Bike</Text>
                  )
                ) : isSaving ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={buttons.textPrimary}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}