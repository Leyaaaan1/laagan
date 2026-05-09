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
import {getMyProfile, getProfileByUsername} from '../services/profileService';
import {
  updateProfile,
  addRiderType,
  removeRiderType,
} from '../services/profileService';
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
      <Image
        source={{uri: String(profilePictureUrl)}}
        style={profileStyles.avatarImage}
      />
    );
  }
  return <Text style={profileStyles.avatarInitial}>{initial}</Text>;
}

function RiderTypeBadges({riderTypes, onRemove, isEditable}) {
  if (!Array.isArray(riderTypes) || riderTypes.length === 0) return null;
  return (
    <View style={profileStyles.badgeRow}>
      {riderTypes.map((type, idx) => (
        <View key={String(type) + idx} style={profileStyles.badge}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Text style={profileStyles.badgeText}>{s(type, 'Unknown')}</Text>
            {isEditable && onRemove && (
              <TouchableOpacity
                onPress={() => onRemove(type)}
                style={{padding: 2}}>
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
      <View
        style={[
          profileStyles.sectionHeader,
          {justifyContent: 'space-between'},
        ]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View style={[profileStyles.sectionIndicator]} />
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

  // ✅ Get the username from route params OR use your own
  const viewingUsername = route?.params?.username ?? authUsername;
  const isOwnProfile = viewingUsername === authUsername;

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

      // ✅ Use different functions based on whose profile is being viewed
      let result;
      if (isOwnProfile) {
        result = await getMyProfile();
      } else {
        result = await getProfileByUsername(viewingUsername);
      }

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
  }, [isOwnProfile, viewingUsername]);

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
        closeEditModal();
        Alert.alert('Success', 'Bike type added successfully!');
      } else {
        Alert.alert('Error', result?.message || 'Failed to add bike type');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add bike type');
    } finally {
      setIsAddingType(false);
    }
  };

  const handleRemoveRiderType = async type => {
    setIsRemovingType(true);
    try {
      const result = await removeRiderType(type);

      if (result?.success) {
        setProfile(result.data);
        Alert.alert('Success', 'Bike type removed successfully!');
      } else {
        Alert.alert('Error', result?.message || 'Failed to remove bike type');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to remove bike type');
    } finally {
      setIsRemovingType(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{name: 'AuthScreen'}],
            });
          } catch (err) {
            Alert.alert('Error', 'Failed to logout');
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View
        style={[
          profileStyles.screen,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          profileStyles.screen,
          {justifyContent: 'center', alignItems: 'center', padding: spacing.lg},
        ]}>
        <Text style={{color: colors.white, textAlign: 'center'}}>{error}</Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={[buttons.pill, {marginTop: spacing.lg}]}>
          <Text style={{color: colors.white}}>Retry</Text>
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
            tintColor={colors.primary}
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
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}>
            <Text style={profileStyles.displayName} numberOfLines={1}>
              {displayName}
            </Text>
            {/* ✅ Only show edit button for own profile */}
            {isOwnProfile && (
              <TouchableOpacity
                onPress={() => openEditModal('displayName')}
                style={[buttons.ghost, {marginLeft: spacing.sm}]}>
                <FontAwesome name="edit" size={16} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
          {usernameStr.length > 0 && (
            <Text style={profileStyles.username}>{'@' + usernameStr}</Text>
          )}
        </View>

        {/* ✅ Only show About section and edit for own profile */}
        {isOwnProfile && (
          <SectionCard
            title="About"
            right={
              <TouchableOpacity
                onPress={() => openEditModal('bio')}
                style={[buttons.ghost, {marginLeft: spacing.sm}]}>
                <FontAwesome name="edit" size={14} color={colors.white} />
              </TouchableOpacity>
            }>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}>
              <Text
                style={{
                  flex: 1,
                  color: colors.white,
                  fontSize: fontSize.body,
                  lineHeight: 20,
                }}>
                {bioStr || 'No bio yet'}
              </Text>
            </View>
          </SectionCard>
        )}

        {/* ✅ Show About readonly for other profiles */}
        {!isOwnProfile && bioStr && (
          <SectionCard title="About">
            <View
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}>
              <Text style={{color: colors.white, fontSize: fontSize.body}}>
                {bioStr}
              </Text>
            </View>
          </SectionCard>
        )}

        <SectionCard title="Bike Types">
          <View
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}>
            <RiderTypeBadges
              riderTypes={profile?.riderTypes ?? []}
              onRemove={isOwnProfile ? handleRemoveRiderType : null}
              isEditable={isOwnProfile}
            />
            {/* ✅ Only show add button for own profile */}
            {isOwnProfile && (
              <TouchableOpacity
                onPress={() => openEditModal('riderTypes')}
                style={[
                  buttons.ghost,
                  {marginTop: spacing.md, alignSelf: 'flex-start'},
                ]}>
                <FontAwesome
                  name="plus"
                  size={14}
                  color={colors.primary}
                  style={{marginRight: 4}}
                />
                <Text style={{color: colors.primary}}>Add Bike Type</Text>
              </TouchableOpacity>
            )}
          </View>
        </SectionCard>

        {/* ✅ Only show member info and logout for own profile */}
        {isOwnProfile && (
          <>
            <SectionCard title="Account">
              <View
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }}>
                {memberSince && (
                  <Text style={{color: colors.white, fontSize: fontSize.body}}>
                    Member since {memberSince}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={handleLogout}
                  disabled={loggingOut}
                  style={[
                    buttons.pill,
                    {
                      marginTop: spacing.lg,
                      backgroundColor: '#dc2626',
                      opacity: loggingOut ? 0.6 : 1,
                    },
                  ]}>
                  {loggingOut ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{color: colors.white}}>Logout</Text>
                  )}
                </TouchableOpacity>
              </View>
            </SectionCard>
          </>
        )}
      </ScrollView>

      {/* Edit Modal - only shown for own profile */}
      {isOwnProfile && (
        <Modal
          visible={editModal.visible}
          transparent
          animationType="slide"
          onRequestClose={closeEditModal}>
          <View style={profileStyles.modalOverlay}>
            <View style={profileStyles.modalContent}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.lg,
                }}>
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 18,
                    fontWeight: '600',
                  }}>
                  Edit {editModal.field}
                </Text>
                <TouchableOpacity onPress={closeEditModal}>
                  <FontAwesome name="times" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>

              {editModal.field === 'riderTypes' ? (
                <RideTypeSelector
                  selectedTypes={profile?.riderTypes ?? []}
                  onSelectType={type => {
                    setEditValues({...editValues, riderTypes: type});
                  }}
                />
              ) : (
                <TextInput
                  style={inputs.auth}
                  placeholder={`Enter ${editModal.field}`}
                  placeholderTextColor="#999"
                  value={editValues[editModal.field]}
                  onChangeText={val =>
                    setEditValues({...editValues, [editModal.field]: val})
                  }
                  multiline={editModal.field === 'bio'}
                  numberOfLines={editModal.field === 'bio' ? 4 : 1}
                />
              )}

              <View
                style={{
                  flexDirection: 'row',
                  gap: spacing.md,
                  marginTop: spacing.lg,
                }}>
                <TouchableOpacity
                  onPress={closeEditModal}
                  style={[buttons.ghost, {flex: 1}]}>
                  <Text style={{color: colors.white}}>Cancel</Text>
                </TouchableOpacity>

                {editModal.field === 'riderTypes' ? (
                  <TouchableOpacity
                    onPress={handleAddRiderType}
                    disabled={isAddingType}
                    style={[
                      buttons.pill,
                      {flex: 1, opacity: isAddingType ? 0.6 : 1},
                    ]}>
                    {isAddingType ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{color: colors.white}}>Add Type</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleSaveEdit}
                    disabled={isSaving}
                    style={[
                      buttons.pill,
                      {flex: 1, opacity: isSaving ? 0.6 : 1},
                    ]}>
                    {isSaving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{color: colors.white}}>Save</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
