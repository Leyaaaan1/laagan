import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ScrollView, ActivityIndicator, Image, StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import getMapHTML from '../../utilities/mapHTML';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { getLocationImage } from '../../services/rideService';
import feedback from '../../styles/base/feedback';
import images from '../../styles/base/images';
import buttons from '../../styles/base/buttons';
import rideCreation from '../../styles/screens/rideCreation';
import inputs from '../../styles/base/inputs';
import layout from '../../styles/base/layout';
import text from '../../styles/base/text';
import spacing from '../../styles/tokens/spacing';

// Philippines centre — safe default when no coords are available yet
const DEFAULT_LAT = 12.8797;
const DEFAULT_LNG = 121.7740;

const RideStep2 = ({
                     isSearching, searchResults, searchQuery, setSearchQuery,
                     handleLocationSelect, webViewRef, latitude, longitude,
                     handleMessage, locationName,
                     prevStep, nextStep, handleSearchInputChange, token,
                   }) => {
  const [isSearchFocused, setIsSearchFocused]         = useState(false);
  const [rideNameImage, setRideNameImage]             = useState([]);
  const [rideNameImageLoading, setRideNameImageLoading] = useState(false);
  const [rideNameImageError, setRideNameImageError]   = useState(null);

  // The debounce timer fires the actual search after 400 ms of inactivity,
  // which prevents every keystroke from triggering a re-render cascade that
  // remounts the WebView and kills keyboard focus.
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const debounceRef = useRef(null);

  const handleLocalChange = (value) => {
    setLocalQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSearchInputChange(value);
    }, 400);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    clearTimeout(debounceRef.current);
    setSearchQuery('');
    handleSearchInputChange('');
  };

  // Keep local buffer in sync when parent clears externally
  useEffect(() => {
    if (!searchQuery) setLocalQuery('');
  }, [searchQuery]);

  // ── Freeze map HTML ───────────────────────────────────────────────────────
  // useMemo with an empty dep array means the HTML string is computed exactly
  // once — the WebView never receives a new `source` prop, so it never
  // remounts. Subsequent pans/markers are handled via injectJavaScript from
  // the parent (centerMap / updateMarker), not by re-rendering this component.
  const mapHtml = useMemo(() => {
    const initLat = parseFloat(latitude) || DEFAULT_LAT;
    const initLng = parseFloat(longitude) || DEFAULT_LNG;
    return getMapHTML(initLat, initLng);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Location images ───────────────────────────────────────────────────────
  const fetchLocationImages = useCallback(async (name) => {
    setRideNameImageLoading(true);
    setRideNameImageError(null);
    try {
      const imgs = await getLocationImage(name, token);
      setRideNameImage(Array.isArray(imgs) ? imgs : []);
    } catch (error) {
      setRideNameImageError(error.message);
      setRideNameImage([]);
    } finally {
      setRideNameImageLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (locationName && locationName.trim()) {
      fetchLocationImages(locationName);
    } else {
      setRideNameImage([]);
    }
  }, [locationName, fetchLocationImages]);

  return (
    <View style={[layout.screen, { backgroundColor: 'transparent' }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* ── Full-screen map — rendered ONCE, never remounted ── */}
      <View style={rideCreation.mapFill}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      </View>

      {/* ── Floating navbar ── */}
      <View style={[rideCreation.floatingNav, {
        backgroundColor: 'rgba(255,255,255,0.95)',
        top: 16,
      }]}>
        <TouchableOpacity style={buttons.back} onPress={prevStep} activeOpacity={0.8}>
          <FontAwesome name="arrow-left" size={14} color="#8c2323" style={{ marginRight: 6 }} />
          <Text style={[buttons.textDark, { fontSize: 14 }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[text.label, { color: '#1a1a1a' }]}>SET LOCATION</Text>

        <TouchableOpacity
          style={[buttons.row, { paddingVertical: 8, paddingHorizontal: 12 }]}
          onPress={nextStep}
          activeOpacity={0.8}
        >
          <Text style={buttons.textSm}>Next</Text>
          <FontAwesome name="arrow-right" size={14} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* ── Search card ── */}
      <View style={rideCreation.searchContainer}>
        <View style={[inputs.searchRow, isSearchFocused && inputs.searchRowFocused]}>
          <FontAwesome name="search" size={16} color="#5f6368" style={{ marginRight: 12 }} />
          <TextInput
            style={inputs.location}
            value={localQuery}               // local buffer, not parent prop
            onChangeText={handleLocalChange} // debounced — no mid-keystroke re-renders
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
            <TouchableOpacity onPress={handleClearSearch} style={{ padding: 4, marginRight: 8 }}>
              <FontAwesome name="times-circle" size={16} color="#9aa0a6" />
            </TouchableOpacity>
          )}
        </View>

        {isSearching && (
          <View style={[feedback.loadingRow, { marginTop: 12 }]}>
            <ActivityIndicator size="small" color="#8c2323" />
            <Text style={feedback.loadingText}>Finding locations…</Text>
          </View>
        )}

        {searchResults.length > 0 && (
          <ScrollView
            style={[inputs.resultsList, { maxHeight: 220 }]}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                }}
              >
                <View style={{ width: 20, height: 36, justifyContent: 'center', alignItems: 'center' }}>
                  <FontAwesome name="map-marker" size={16} color="#8c2323" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={inputs.resultName}>{item.display_name.split(',')[0]}</Text>
                  <Text style={inputs.resultAddress} numberOfLines={1}>{item.display_name}</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#dadce0" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Bottom panel: selected location + photos + CTA ── */}
      {locationName && locationName.trim() ? (
        <View style={{ position: 'absolute', bottom: 24, left: 12, right: 12, zIndex: 40 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: spacing.md, elevation: 16 }}>
            <View style={[layout.rowBetween, { marginBottom: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[text.label, { marginBottom: 2 }]}>SELECTED LOCATION</Text>
                <Text style={[text.body, { color: '#1a1a1a', fontWeight: '700' }]} numberOfLines={2}>
                  {locationName}
                </Text>
              </View>
              <FontAwesome name="map-marker" size={22} color="#8c2323" style={{ marginLeft: 12 }} />
            </View>

            {rideNameImageLoading ? (
              <View style={[feedback.loadingRow, { marginBottom: 10 }]}>
                <ActivityIndicator size="small" color="#8c2323" />
                <Text style={feedback.loadingText}>Loading photos…</Text>
              </View>
            ) : Array.isArray(rideNameImage) && rideNameImage.length > 0 ? (
              <FlatList
                data={rideNameImage}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, idx) => idx.toString()}
                style={{ marginBottom: 12 }}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => (
                  <View style={{ width: 110, height: 80, borderRadius: 10, overflow: 'hidden', backgroundColor: '#ddd' }}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                    />
                    {(item.author || item.license) && (
                      <View style={[images.metaOverlay, { paddingVertical: 3 }]}>
                        <Text style={[images.metaText, { fontSize: 9 }]} numberOfLines={1}>
                          {item.author ? `📷 ${item.author}` : item.license}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              />
            ) : null}

            <TouchableOpacity style={buttons.primary} onPress={nextStep} activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={buttons.textPrimary}>Confirm Location & Continue</Text>
                <FontAwesome name="arrow-right" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ position: 'absolute', bottom: 28, left: 20, right: 20, zIndex: 40, alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20 }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', textAlign: 'center' }}>
              📍 Tap the map or search above to set your location
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default RideStep2;