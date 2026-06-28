import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
  useMemo,
} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Keyboard,
  Animated,
  Alert,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { getActiveRide } from '../services/startService';
import { getRideDetails } from '../services/rideService';
import ScannerHeader from './utilities/ScannerHeader';
import layout from '../styles/base/layout';
import header from '../styles/base/header';
import s from '../styles/screens/riderPage';
import { getMyProfile } from '../services/profileService';
import colors from '../styles/tokens/colors';
import { buildRideStep4Params } from '../utilities/NavigationParamsBuilder';
import { getRideTypeIcon } from '../utilities/rideTypes';
import { useAuth } from '../context/AuthContext';
import { RideContext } from '../context/RideContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RidesList from '../components/ride/modal/RidesList';
import {useFocusEffect} from '@react-navigation/native';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) { return 'Riding late tonight'; }
  if (hour < 12) { return 'Good morning'; }
  if (hour < 18) { return 'Good afternoon'; }
  return 'Good evening';
};

const getRideStatus = ride => {
  if (!ride) { return 'active'; }
  const raw = (ride.status || ride.rideStatus || '').toString().toLowerCase();
  if (raw.includes('finish') || raw.includes('complete')) { return 'finished'; }
  if (raw.includes('upcoming') || raw.includes('scheduled')) { return 'upcoming'; }
  return 'active';
};

const STATUS_META = {
  active: {
    label: 'Active',
    dotColor: colors.success,
    style: 'statusActive',
    textColor: colors.success,
  },
  upcoming: {
    label: 'Upcoming',
    dotColor: colors.primary,
    style: 'statusUpcoming',
    textColor: colors.primary,
  },
  finished: {
    label: 'Finished',
    dotColor: colors.textMuted,
    style: 'statusFinished',
    textColor: colors.textSecondary,
  },
};


// ─── ProfileAvatar ────────────────────────────────────────────────────────────
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
  const initial = profile?.displayName || profile?.username || '';
  if (initial) {
    return (
      <Text style={{ color: '#cc0000', fontSize: 18, fontWeight: '700' }}>
        {initial[0].toUpperCase()}
      </Text>
    );
  }
  return <FontAwesome name="user" size={20} color="#fff" />;
};

// ─── AnimatedPress ────────────────────────────────────────────────────────────
// Lightweight press-scale wrapper so the quick action cards feel tactile,
// without pulling in any new dependency.
const AnimatedPress = ({ onPress, style, disabled, children }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = value =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        style={{ flex: 1, width: '100%' }}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] ?? STATUS_META.active;
  return (
    <View style={[s.statusBadge, s[meta.style]]}>
      <View style={[s.statusBadgeDot, { backgroundColor: meta.dotColor }]} />
      <Text style={[s.statusBadgeText, { color: meta.textColor }]}>
        {meta.label}
      </Text>
    </View>
  );
};

// ─── RiderPage ────────────────────────────────────────────────────────────────
const RiderPage = ({ navigation }) => {
  const { username, ready, logout } = useAuth();

  const {
    activeRide: contextActiveRide,
    clearActiveRide: clearContextActiveRide,
  } = useContext(RideContext);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [fetchedActiveRide, setFetchedActiveRide] = useState(null);
  const [activeRideLoading, setActiveRideLoading] = useState(false);
  const [profileRefreshing, setProfileRefreshing] = useState(false);
  const [rideCode, setRideCode] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const ridesListRefRef = useRef(null);
  // Ref to trigger ScannerHeader's modal from our custom card button
  const scannerRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const displayActiveRide = fetchedActiveRide ?? contextActiveRide;
  const insets = useSafeAreaInsets();
  const prevUsernameRef = useRef(null);

  // AFTER
  // Find this existing useEffect (~line 176) and replace it:

  useEffect(() => {
    const prev = prevUsernameRef.current;
    const didChange = prev !== null && prev !== username;
    const didLogout = prev !== null && username === null;

    if (didChange || didLogout) {
      clearContextActiveRide();
      setFetchedActiveRide(null);  // ← add
      setProfile(null);            // ← add
      setRideCode('');             // ← add
      setSearchError('');          // ← add
      ridesListRefRef.current?.reset?.(); // ← add (if RidesList exposes reset)
    }

    // only update ref on real username, so logout (null) is still
    // caught as a change when the next user logs in
    if (username) {
      prevUsernameRef.current = username;
    }
  }, [username, clearContextActiveRide]);
  ;

  // ── Fetch active ride ─────────────────────────────────────────────────────
  const fetchActiveRide = useCallback(async () => {
    try {
      setActiveRideLoading(true);
      const result = await getActiveRide();
      const hasRide = result && (result.generatedRidesId || result.ridesName);
      setFetchedActiveRide(hasRide ? result : null);
    } catch (err) {
      const msg = err?.message ?? '';
      if (msg === 'NOT_FOUND') {
        setFetchedActiveRide(null);
        clearContextActiveRide();
        return;
      }
      if (msg === 'SERVER_ERROR' || msg.startsWith('5')) {
        return;
      }
    } finally {
      setActiveRideLoading(false);
    }
  }, [clearContextActiveRide]);

  // ── Fetch profile ─────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const result = await getMyProfile();
      if (result.success) {
        setProfile(result.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
      setProfileRefreshing(false);
    }
  }, []);

// AFTER
  useEffect(() => {
    if (!ready) { return; }
    fetchProfile();
  }, [ready, fetchProfile]);

  useFocusEffect(
    useCallback(() => {
      if (!ready) { return; }
      fetchActiveRide();
    }, [ready, fetchActiveRide]),
  );



  const rideStatus = useMemo(
    () => getRideStatus(displayActiveRide),
    [displayActiveRide],
  );


  if (!ready) {
    return (
      <View
        style={[
          layout.screen,
          { alignItems: 'center', justifyContent: 'center' },
        ]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRideSelect = async item => {
    try {
      const ride = await getRideDetails(item.generatedRidesId);
      const params = buildRideStep4Params(ride, username);
      navigation.navigate('RideStep4', params);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to open ride');
    }
  };
  const handleCreateRide = () => navigation.navigate('CreateRide', { username });

  const handleOpenActiveRide = () => {
    if (!displayActiveRide) { return; }
    navigation.navigate('StartedRide', {
      activeRide: displayActiveRide,
      currentUsername: username,
    });
  };

  const handleOpenProfile = () =>
    navigation.navigate('RiderProfile', { username });

  // Uses getRideDetails (same as SearchHeader) — fetches full ride then navigates
  const handleSearchRide = async () => {
    const trimmed = rideCode.trim();
    if (!trimmed) {
      setSearchError('Please enter a ride code');
      return;
    }
    Keyboard.dismiss();
    setSearchLoading(true);
    setSearchError('');
    try {
      const ride = await getRideDetails(trimmed);
      const params = buildRideStep4Params(ride, username);
      setRideCode('');
      navigation.navigate('RideStep4', params);
    } catch (err) {
      setSearchError(err?.message || 'Ride not found');
    } finally {
      setSearchLoading(false);
    }
  };

  const riderType = profile?.riderTypes?.[0] ?? null;

  const hasActiveRide =
    (activeRideLoading && !displayActiveRide) ||
    (displayActiveRide &&
      (displayActiveRide.generatedRidesId || displayActiveRide.ridesName));

  return (
    <View style={layout.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />
      {/* ── Top nav bar ───────────────────────────────────────────────────── */}
      <View
        style={[
          s.navbar,
          {
            paddingTop: insets.top + 4,
            paddingHorizontal: 16,
            paddingBottom: 10,
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenProfile}
          style={header.avatar}>
          <ProfileAvatar profile={profile} avatarStyle={header.avatar} />
        </TouchableOpacity>
        <View style={{flex: 1, marginLeft: 10}}>
          <Text
            style={[header.username, {fontSize: 14, flexShrink: 1}]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}>
            {getGreeting()}, {username ?? 'Rider'}
          </Text>
          {loading ? (
            <ActivityIndicator
              color="#fff"
              size="small"
              style={{marginTop: 4}}
            />
          ) : (
            <View>
              <Text style={[header.username, {fontSize: 14, flexShrink: 1}]}>
                <FontAwesome
                  name={getRideTypeIcon(riderType)}
                  size={11}
                  color={colors.primary}
                  style={{marginRight: 4, paddingRight: 8}}
                />{' '}
                {riderType ?? 'unknown'}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setMenuVisible(true)}
          style={{padding: 6}}>
          <FontAwesome name="cog" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        {menuVisible && (
          <>
            {/* invisible backdrop — tap outside to close */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99,
              }}
              activeOpacity={1}
              onPress={() => setMenuVisible(false)}
            />

            {/* dropdown card, anchored right under the cog */}
            <View
              style={{
                position: 'absolute',
                top: insets.top + 58,
                right: 16,
                backgroundColor: '#1a1a1a',
                borderRadius: 16,
                paddingVertical: 6,
                minWidth: 140,
                zIndex: 100,
                elevation: 12,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.3,
                shadowRadius: 10,
              }}>
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  handleOpenProfile();
                }}
                style={{paddingVertical: 12, paddingHorizontal: 16}}>
                <Text style={{color: colors.white}}>Profile</Text>
              </TouchableOpacity>

              <View
                style={{
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  marginHorizontal: 12,
                }}
              />

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  logout();
                }}
                style={{paddingVertical: 12, paddingHorizontal: 16}}>
                <Text style={{color: '#dc2626'}}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      {/* ── Scrollable body — RidesList's own FlatList is now the single
            scroll container for the whole screen, so nothing's nested
            inside a ScrollView anymore. ─────────────────────────────── */}
      <RidesList
        mode="my"
        userId={username}
        onRideSelect={handleRideSelect}
        style={{flex: 1}}
        contentContainerStyle={{paddingHorizontal: 15, paddingBottom: 40}}
        ListHeaderComponent={
          <>
            <View style={s.heroContainer}>
              <Text style={s.heroGreeting}>
                {getGreeting()}, {username ?? 'Rider'}
              </Text>
              <Text style={s.heroTitle}>Ready to ride?</Text>
              <Text style={s.heroSubtitle}>
                Scan a code, enter a ride ID, or create your own.
              </Text>
            </View>

            <View style={s.searchSection}>
              <Text style={s.sectionLabel}>Find a ride</Text>

              <View style={s.searchCard}>
                <FontAwesome
                  name="search"
                  size={15}
                  color={colors.textSecondary}
                  style={{marginLeft: 4}}
                />
                <TextInput
                  style={s.searchInput}
                  placeholder="Enter ride code"
                  placeholderTextColor={colors.textMuted}
                  value={rideCode}
                  onChangeText={text => {
                    setRideCode(text);
                    if (searchError) {
                      setSearchError('');
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={handleSearchRide}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSearchRide}
                  disabled={searchLoading}
                  style={s.searchJoinBtn}>
                  {searchLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Text style={s.searchJoinLabel}>Search</Text>
                      <FontAwesome
                        name="arrow-right"
                        size={11}
                        color={colors.white}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {searchError ? (
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 11,
                    marginTop: 6,
                    marginLeft: 4,
                  }}>
                  {searchError}
                </Text>
              ) : (
                <Text style={s.searchHelperText}>
                  Enter a ride code shared by your group.
                </Text>
              )}
            </View>
            <ScannerHeader ref={scannerRef} navigation={navigation} cardMode />

            {/* ── Quick action cards ─────────────────────────────────── */}
            <View style={s.actionRow}>
              {/* Scan QR */}
              <AnimatedPress
                style={s.actionCardPrimary}
                onPress={() => scannerRef.current?.openScanner('invite')}>
                <View>
                  <FontAwesome name="qrcode" size={20} color={colors.white} />
                </View>
                <View>
                  <Text style={s.actionLabel}>Scan QR</Text>
                  <Text style={s.actionSubLabelLight}>Join via code</Text>
                </View>
              </AnimatedPress>
              {/* Create Ride */}
              <AnimatedPress
                onPress={handleCreateRide}
                style={s.actionCardPrimary}>
                <View>
                  <FontAwesome name="plus" size={20} color={colors.white} />
                </View>

                <View>
                  <Text style={s.actionLabel}>Create Ride</Text>
                  <Text style={s.actionSubLabelLight}>Start something new</Text>
                </View>
              </AnimatedPress>
            </View>

            <View style={s.ridesSection}>

              {activeRideLoading && !displayActiveRide ? (
                <View style={s.rideCardSkeleton}>
                  <ActivityIndicator color={colors.primary} size="small" />
                </View>
              ) : hasActiveRide ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleOpenActiveRide}
                  style={s.rideCard}>
                  <View style={s.rideCardTopRow}>
                    <Text style={s.rideCardName} numberOfLines={1}>
                      {displayActiveRide.ridesName ?? 'Untitled ride'}
                    </Text>
                    <StatusBadge status={rideStatus} />
                  </View>

                  {displayActiveRide.locationName ? (
                    <View style={s.rideCardMetaRow}>
                      <FontAwesome
                        name="map-marker"
                        size={12}
                        color={colors.textMuted}
                      />
                      <Text style={s.rideCardMetaText} numberOfLines={1}>
                        {displayActiveRide.locationName}
                      </Text>
                    </View>
                  ) : null}

                  <View style={s.rideCardMetaRow}>
                    {displayActiveRide.participantsCount != null ||
                    displayActiveRide.ridersCount != null ? (
                      <>
                        <FontAwesome
                          name="users"
                          size={12}
                          color={colors.textMuted}
                        />
                        <Text style={s.rideCardMetaText}>
                          {displayActiveRide.participantsCount ??
                            displayActiveRide.ridersCount}{' '}
                          riders
                        </Text>
                      </>
                    ) : null}
                    {displayActiveRide.distance != null ? (
                      <>
                        <FontAwesome
                          name="road"
                          size={12}
                          color={colors.textMuted}
                          style={{
                            marginLeft:
                              displayActiveRide.participantsCount != null
                                ? spacingGapFallback
                                : 0,
                          }}
                        />
                        <Text style={s.rideCardMetaText}>
                          {displayActiveRide.distance} km
                        </Text>
                      </>
                    ) : null}
                  </View>

                  <View style={s.rideCardFooterRow}>
                    <Text style={s.rideCardDateText}>
                      {displayActiveRide.scheduledAt ??
                        displayActiveRide.startTime ??
                        displayActiveRide.date ??
                        'Today'}
                    </Text>
                    <View style={s.rideCardViewBtn}>
                      <Text style={s.rideCardViewBtnText}>View details</Text>
                      <FontAwesome
                        name="chevron-right"
                        size={11}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={s.emptyStateCard}>
                  <View style={s.emptyStateIconWell}>
                    <FontAwesome name="road" size={26} color={colors.primary} />
                  </View>
                  <Text style={s.emptyStateTitle}>
                    Your adventures start here.
                  </Text>
                  <Text style={s.emptyStateSubtitle}>
                    You don't have any rides yet. Create one and invite your
                    group, or join with a code above.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleCreateRide}
                    style={s.emptyStateButton}>
                    <FontAwesome name="plus" size={12} color={colors.white} />
                    <Text style={s.emptyStateButtonText}>
                      Create your first ride
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionLabel}>My rides</Text>
            </View>
          </>
        }
      />
    </View>
  );
};

// Small fallbacks used only for inline spacing tweaks above (kept local so
// this file has no new dependency on the spacing token file).
const spacingGapFallback = 10;
const spacingBottomFallback = 8;

export default RiderPage;
