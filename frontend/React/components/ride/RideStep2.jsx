import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {WebView} from 'react-native-webview';
import getMapHTML from '../../utilities/mapHTML';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {getLocationImage} from '../../services/rideService';
import feedback from '../../styles/base/feedback';
import buttons from '../../styles/base/buttons';
import rideCreation from '../../styles/screens/rideCreation';
import inputs from '../../styles/base/inputs';
import layout from '../../styles/base/layout';
import text from '../../styles/base/text';
import spacing from '../../styles/tokens/spacing';
import {buildSearchHandlers} from './utilities/RideStepUtils';
import {DEFAULT_COORDS} from '../../utilities/route/map/appDefaults';
import {createMemoCompare} from '../../utilities/propsComparison';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const DEFAULT_LAT = parseFloat(DEFAULT_COORDS.latitude);
const DEFAULT_LNG = parseFloat(DEFAULT_COORDS.longitude);

// ─── Sub-components ───────────────────────────────────────────────────────────


/** Bottom panel shown after a location has been selected. */
const SelectedLocationPanel = ({
  locationName,
  onConfirm,
  bottomInset,
}) => (
  <View
    style={{
      position: 'absolute',
      bottom: 24 + bottomInset,
      left: 12,
      right: 12,
      zIndex: 40,
    }}>
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: spacing.md,
        elevation: 16,
      }}>
      <View style={[layout.rowBetween, {marginBottom: 10}]}>
        <View style={{flex: 1}}>
          <Text style={[text.label, {marginBottom: 2}]}>SELECTED LOCATION</Text>
          <Text
            style={[text.body, {color: '#1a1a1a', fontWeight: '700'}]}
            numberOfLines={2}>
            {locationName}
          </Text>
        </View>
        <FontAwesome
          name="map-marker"
          size={22}
          color="#8c2323"
          style={{marginLeft: 12}}
        />
      </View>

      <TouchableOpacity
        style={buttons.primary}
        onPress={onConfirm}
        activeOpacity={0.85}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Text style={buttons.textPrimary}>
            Confirm Location &amp; Continue
          </Text>
          <FontAwesome name="arrow-right" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  </View>
);

/** Prompt shown when no location is selected yet. */
const NoSelectionHint = ({bottomInset}) => (
  <View
    style={{
      position: 'absolute',
      bottom: 28 + bottomInset,
      left: 20,
      right: 20,
      zIndex: 40,
      alignItems: 'center',
    }}>
    <View
      style={{
        backgroundColor: 'rgba(0,0,0,0.72)',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
      }}>
      <Text
        style={{
          color: '#fff',
          fontSize: 13,
          fontWeight: '500',
          textAlign: 'center',
        }}>
        📍 Tap the map or search above to set your location
      </Text>
    </View>
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

const RideStep2 = ({
  isSearching,
  searchResults,
  searchQuery,
  setSearchQuery,
  handleLocationSelect,
  webViewRef,
  latitude,
  longitude,
  handleMessage,
  locationName,
  prevStep,
  nextStep,
  handleSearchInputChange,

  token,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [locationImages, setLocationImages] = useState([]);
  const [locationImageLoading, setLocationImageLoading] = useState(false);

  // ── Local search buffer with debounce ─────────────────────────────────────
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const debounceRef = useRef(null);
  const insets = useSafeAreaInsets();

  const {handleLocalChange, handleClearSearch} = buildSearchHandlers({
    debounceRef,
    setLocalQuery,
    handleSearchInputChange,
    setSearchQuery,
  });

  // Keep local buffer in sync when parent clears externally
  useEffect(() => {
    if (!searchQuery) {
      setLocalQuery('');
    }
  }, [searchQuery]);

  // ── Freeze map HTML — computed once so the WebView never remounts ─────────
  const mapHtml = useMemo(() => {
    const initLat = parseFloat(latitude) || DEFAULT_LAT;
    const initLng = parseFloat(longitude) || DEFAULT_LNG;
    return getMapHTML(initLat, initLng);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pan map to real GPS location once it resolves ─────────────────────────
  // ── Track whether map is ready, pan immediately if GPS arrives after mapReady
  const mapReadyRef = useRef(false);

  useEffect(() => {
    if (!mapReadyRef.current) return;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!lat || !lng) return;
    webViewRef.current?.injectJavaScript(`
    if (window.map) {
      window.map.setView([${lat}, ${lng}], 13);
    }
    true;
  `);
  }, [latitude, longitude, webViewRef]);

  // ── Fetch photos whenever the location name changes ───────────────────────
  const fetchLocationImages = useCallback(async name => {
    setLocationImageLoading(true);
    try {
      const imgs = await getLocationImage(name);
      setLocationImages(Array.isArray(imgs) ? imgs : []);
    } catch {
      setLocationImages([]);
    } finally {
      setLocationImageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (locationName?.trim()) {
      fetchLocationImages(locationName);
    } else {
      setLocationImages([]);
    }
  }, [locationName, fetchLocationImages]);

  const hasLocation = locationName?.trim();

  return (
    <View style={[layout.screen, {backgroundColor: 'transparent'}]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* ── Full-screen map — rendered once, never remounted ── */}
      <View style={rideCreation.mapFill}>
        <WebView
          ref={webViewRef}
          source={{html: mapHtml}}
          style={{flex: 1}}
          onMessage={event => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'mapReady') {
                mapReadyRef.current = true;
                const lat = parseFloat(latitude);
                const lng = parseFloat(longitude);
                if (lat && lng) {
                  webViewRef.current?.injectJavaScript(`
            if (window.map) {
              window.map.setView([${lat}, ${lng}], 13);
            }
            true;
          `);
                }
                return;
              }
            } catch (_) {}
            handleMessage(event);
          }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      </View>

      {/* ── Floating navbar ── */}
      <View
        style={[
          rideCreation.floatingNav,
          {backgroundColor: 'rgba(255,255,255,0.95)', top: insets.top + 8},
        ]}>
        <TouchableOpacity
          style={buttons.back}
          onPress={prevStep}
          activeOpacity={0.8}>
          <FontAwesome
            name="arrow-left"
            size={14}
            color="#8c2323"
            style={{marginRight: 6}}
          />
          <Text style={[buttons.textDark, {fontSize: 14}]}>Back</Text>
        </TouchableOpacity>
        <Text style={[text.label, {color: '#1a1a1a'}]}>SET LOCATION</Text>
        <TouchableOpacity
          style={[buttons.row, {paddingVertical: 8, paddingHorizontal: 12}]}
          onPress={nextStep}
          activeOpacity={0.8}>
          <Text style={buttons.textSm}>Next</Text>
          <FontAwesome
            name="arrow-right"
            size={14}
            color="#fff"
            style={{marginLeft: 6}}
          />
        </TouchableOpacity>
      </View>

      {/* ── Search card ── */}
      <View style={[rideCreation.searchContainer, {top: insets.top + 75}]}>
        <View
          style={[
            inputs.searchRow,
            isSearchFocused && inputs.searchRowFocused,
          ]}>
          <FontAwesome
            name="search"
            size={16}
            color="#5f6368"
            style={{marginRight: 12}}
          />
          <TextInput
            style={inputs.location}
            value={localQuery}
            onChangeText={handleLocalChange}
            placeholder="Where do you want to ride?"
            placeholderTextColor="#9aa0a6"
            returnKeyType="search"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onSubmitEditing={() => {
              clearTimeout(debounceRef.current);
              handleSearchInputChange(localQuery);
            }}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {localQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={{padding: 4, marginRight: 8}}>
              <FontAwesome name="times-circle" size={16} color="#9aa0a6" />
            </TouchableOpacity>
          )}
        </View>

        {isSearching && (
          <View style={[feedback.loadingRow, {marginTop: 12}]}>
            <ActivityIndicator size="small" color="#8c2323" />
            <Text style={feedback.loadingText}>Finding locations…</Text>
          </View>
        )}

        {searchResults.length > 0 && (
          <ScrollView
            style={[inputs.resultsList, {maxHeight: 220}]}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {searchResults.map((item, index) => (
              <TouchableOpacity
                key={item.place_id.toString()}
                style={[
                  inputs.resultItem,
                  index === searchResults.length - 1 && inputs.resultItemLast,
                ]}
                onPress={() => {
                  handleLocationSelect(item);
                  setLocalQuery(item.display_name.split(',')[0]);
                }}>
                <View
                  style={{
                    width: 20,
                    height: 36,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <FontAwesome name="map-marker" size={16} color="#8c2323" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={inputs.resultName}>
                    {item.display_name.split(',')[0]}
                  </Text>
                  <Text style={inputs.resultAddress} numberOfLines={1}>
                    {item.display_name}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#dadce0" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Bottom panel ── */}
      {hasLocation ? (
        <SelectedLocationPanel
          locationName={locationName}
          images={locationImages}
          imageLoading={locationImageLoading}
          onConfirm={nextStep}
          bottomInset={insets.bottom}
        />
      ) : (
        <NoSelectionHint bottomInset={insets.bottom} />
      )}
    </View>
  );
};

export default React.memo(
  RideStep2,
  createMemoCompare([
    'setSearchQuery',
    'handleLocationSelect',
    'webViewRef',
    'handleMessage',
    'handleSearchInputChange',
    'nextStep',
    'prevStep',
  ]),
);
