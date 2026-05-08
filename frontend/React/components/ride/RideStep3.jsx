import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {WebView} from 'react-native-webview';
import getMapHTML from '../../utilities/mapHTML';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {reverseGeocodeLandmark} from '../../services/rideService';
import {createRouteData, getRoutePreview} from '../../services/RouteService';
import text from '../../styles/base/text';
import buttons from '../../styles/base/buttons';
import rideCreation from '../../styles/screens/rideCreation';
import feedback from '../../styles/base/feedback';
import inputs from '../../styles/base/inputs';
import {
  buildCenterMapScript,
  buildDrawRouteScript,
  buildSearchHandlers,
} from './utilities/RideStepUtils';
import LocationSuggestionModal from './utilities/LocationSuggestionModal';
import ridestep3style from '../../styles/components/ridestep3style';
import spacing from '../../styles/tokens/spacing';



/**
 * RouteTimeline: Google Maps-style vertical timeline with nodes, connectors, and editable rows
 */
const RouteTimeline = ({
                         startingPoint,
                         endingPoint,
                         stopPoints,
                         onChangeStart,
                         onChangeEnd,
                         onRemoveStop,
                       }) => {
  const renderNode = (type, index) => {
    switch (type) {
      case 'start':
        return <View style={ridestep3style.nodeStart} />;
      case 'end':
        return <View style={ridestep3style.nodeEnd} />;
      case 'stop':
        return (
          <View style={ridestep3style.nodeStop}>
            <Text style={ridestep3style.nodeLabel}>{index + 1}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={ridestep3style.timelineWrapper}>
      {/* Vertical timeline line (background) */}
      <View style={ridestep3style.timelineLine} />

      {/* START NODE */}
      <View style={ridestep3style.routeRow}>
        <View style={ridestep3style.timelineLeft}>
          {renderNode('start', 0)}
        </View>
        <View style={ridestep3style.routeRowContentWrapper}>
          <Text style={ridestep3style.rowLabel}>Start</Text>
          <Text style={ridestep3style.rowLocationName} numberOfLines={2}>
            {startingPoint || 'Not set'}
          </Text>
        </View>
        <TouchableOpacity
          style={ridestep3style.rowChangeBtn}
          onPress={onChangeStart}>
          <Text style={ridestep3style.rowChangeBtnText}>
            {startingPoint ? 'Change' : 'Set'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* STOP NODES */}
      {stopPoints.length > 0 && (
        <>

          {stopPoints.map((stop, index) => (
            <View key={`stop-${index}`} style={ridestep3style.routeRow}>
              <View style={ridestep3style.timelineLeft}>
                {renderNode('stop', index)}
              </View>
              <View style={ridestep3style.routeRowContentWrapper}>
                <Text style={ridestep3style.rowLabel}>Stop {index + 1}</Text>
                <Text style={ridestep3style.rowLocationName} numberOfLines={2}>
                  {stop.name}
                </Text>
              </View>
              <TouchableOpacity
                style={ridestep3style.rowRemoveBtn}
                onPress={() => onRemoveStop(index)}>
                <FontAwesome name="times" size={16} color="#8c2323" />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* END NODE */}
      <View style={ridestep3style.routeRow}>
        <View style={ridestep3style.timelineLeft}>{renderNode('end', 0)}</View>
        <View style={ridestep3style.routeRowContentWrapper}>
          <Text style={ridestep3style.rowLabel}>End</Text>
          <Text style={ridestep3style.rowLocationName} numberOfLines={2}>
            {endingPoint || 'Not set'}
          </Text>
        </View>
        <TouchableOpacity
          style={ridestep3style.rowChangeBtn}
          onPress={onChangeEnd}>
          <Text style={ridestep3style.rowChangeBtnText}>
            {endingPoint ? 'Change' : 'Set'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ADD STOP BUTTON (only show in stop mode) */}
      <TouchableOpacity style={ridestep3style.addStopBtn}>
        <FontAwesome name="plus" size={14} color="#8c2323" />
        <Text style={ridestep3style.addStopBtnText}>Add Stop</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const RideStep3 = ({
                     mapMode,
                     setMapMode,
                     isSearching,
                     searchResults,
                     handleLocationSelect,
                     webViewRef,
                     startingLatitude,
                     startingLongitude,
                     endingLatitude,
                     endingLongitude,
                     handleMessage,
                     startingPoint,
                     setStartingPoint,
                     endingPoint,
                     setEndingPoint,
                     prevStep,
                     loading,
                     setEndingLatitude,
                     setEndingLongitude,
                     step2LocationName,
                     step2Latitude,
                     step2Longitude,
                     handleCreateRide,
                     handleSearchInputChange,
                     searchQuery,
                     stopPoints,
                     setStopPoints,
                     token,
                   }) => {
  const [currentStop, setCurrentStop] = useState(null);
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [addingStopLoading, setAddingStopLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(true);

  // Bottom sheet animation
  const [bottomSheetCollapsed, setBottomSheetCollapsed] = useState(false);
  const bottomSheetAnimValue = useRef(new Animated.Value(0)).current;

  // ── Local search buffer with shared debounce helper ───────────────────────
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const debounceRef = useRef(null);

  const {handleLocalChange, handleClearSearch} = buildSearchHandlers({
    debounceRef,
    setLocalQuery,
    handleSearchInputChange,
  });

  useEffect(() => {
    if (!searchQuery) {
      setLocalQuery('');
    }
  }, [searchQuery]);

  // ── Freeze initial map HTML ───────────────────────────────────────────────
  const mapHtml = useMemo(() => {
    const initLat = parseFloat(startingLatitude) || 12.8797;
    const initLng = parseFloat(startingLongitude) || 121.774;
    return getMapHTML(initLat, initLng, false);
  }, [startingLatitude, startingLongitude]);

  const handleUseStep2Location = () => {
    if (step2LocationName && step2Latitude && step2Longitude) {
      setEndingPoint(step2LocationName);
      setEndingLatitude(step2Latitude);
      setEndingLongitude(step2Longitude);

      webViewRef.current?.injectJavaScript(
        buildCenterMapScript(
          parseFloat(step2Latitude),
          parseFloat(step2Longitude),
        ),
      );
      setMapMode('stop');
      setTimeout(() => drawRoadRoute(), 500);
    }
    setShowLocationModal(false);
  };

  // ── Route drawing ─────────────────────────────────────────────────────────
  const drawRoadRoute = useCallback(async () => {
    const sLat = parseFloat(startingLatitude);
    const sLng = parseFloat(startingLongitude);
    const eLat = parseFloat(endingLatitude);
    const eLng = parseFloat(endingLongitude);

    if (!sLat || !sLng || !eLat || !eLng) {
      return;
    }

    const isSame =
      Math.abs(sLat - eLat) < 0.0001 && Math.abs(sLng - eLng) < 0.0001;
    if (isSame) {
      return;
    }

    setRouteLoading(true);
    try {
      const routeData = createRouteData(sLat, sLng, eLat, eLng, stopPoints);
      const routeGeoJSON = await getRoutePreview(routeData, token);
      if (!routeGeoJSON?.features?.length) {
        return;
      }

      webViewRef.current?.injectJavaScript(
        buildDrawRouteScript({
          routeGeoJSON,
          startLat: startingLatitude,
          startLng: startingLongitude,
          endLat: endingLatitude,
          endLng: endingLongitude,
          stopPoints,
        }),
      );
    } catch (e) {
      console.error('Route draw error:', e);
    } finally {
      setRouteLoading(false);
    }
  }, [
    startingLatitude,
    startingLongitude,
    endingLatitude,
    endingLongitude,
    stopPoints,
    token,
    webViewRef,
  ]);

  useEffect(() => {
    const bothEndpointsSet =
      startingLatitude &&
      startingLongitude &&
      endingLatitude &&
      endingLongitude;
    const notPickingEndpoint = mapMode !== 'starting' && mapMode !== 'ending';
    if (!bothEndpointsSet || !notPickingEndpoint) {
      return;
    }

    const timer = setTimeout(() => drawRoadRoute(), 1000);

    return () => clearTimeout(timer);
  }, [
    startingLatitude,
    startingLongitude,
    endingLatitude,
    endingLongitude,
    stopPoints,
    mapMode,
  ]);

  // ── Stop point handlers ───────────────────────────────────────────────────
  const startAddStopPoint = () => {
    setMapMode('stop');
    setIsAddingStop(true);
    setCurrentStop(null);
  };

  const handleStopMapMessage = async event => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type !== 'mapClick') {
      return;
    }

    setCurrentStop({
      lat: data.lat,
      lng: data.lng,
      name: 'Fetching…',
    });
    setAddingStopLoading(true);
    const name = await reverseGeocodeLandmark(data.lat, data.lng);
    setCurrentStop({
      lat: data.lat,
      lng: data.lng,
      name: name || `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`,
    });
    setAddingStopLoading(false);
  };

  const confirmStopPoint = () => {
    if (!currentStop) {
      return;
    }
    setStopPoints(prev => [
      ...prev,
      {
        lat: currentStop.lat,
        lng: currentStop.lng,
        name: currentStop.name,
      },
    ]);
    setIsAddingStop(false);
    setCurrentStop(null);
    setMapMode('stop');
    setTimeout(() => drawRoadRoute(), 500);
  };

  const removeStopPoint = index => {
    setStopPoints(prev => prev.filter((_, i) => i !== index));
    setTimeout(() => drawRoadRoute(), 300);
  };

  const finalizePointSelection = () => {
    if (mapMode === 'starting' && startingPoint) {
      setMapMode('ending');
      setLocalQuery('');
    }
    if (mapMode === 'ending' && endingPoint) {
      setMapMode('stop');
      setLocalQuery('');
      setTimeout(() => drawRoadRoute(), 300);
    }
  };

  // ── Location selection + map update ──────────────────────────────────────
  const handleSelectLocationAndUpdateMap = async item => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    let resolvedName = item.display_name
      ? item.display_name.split(',')[0].trim()
      : `${lat}, ${lon}`;

    try {
      const parentName = await handleLocationSelect(item);
      if (parentName) {
        resolvedName = parentName;
      }
    } catch (e) {
      console.warn('handleLocationSelect error:', e);
    }

    if (mapMode === 'starting') {
      setStartingPoint(resolvedName);
    }
    if (mapMode === 'ending') {
      setEndingPoint(resolvedName);
    }
    setLocalQuery(resolvedName);

    webViewRef.current?.injectJavaScript(buildCenterMapScript(lat, lon));

    if (
      endingLatitude &&
      endingLongitude &&
      startingLatitude &&
      startingLongitude
    ) {
      setTimeout(() => drawRoadRoute(), 500);
    }
  };

  // ── WebView message router ────────────────────────────────────────────────
  const onWebViewMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'mapReady':
          if (
            startingLatitude &&
            startingLongitude &&
            endingLatitude &&
            endingLongitude
          ) {
            setTimeout(() => drawRoadRoute(), 1000);
          }
          break;
        case 'mapError':
          console.error('Map error:', data.error);
          break;
        default:
          if (mapMode === 'stop' && isAddingStop) {
            handleStopMapMessage(event);
          } else {
            handleMessage(event);
          }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── Bottom sheet collapse/expand animation ──────────────────────────────
  const toggleBottomSheet = () => {
    setBottomSheetCollapsed(prev => !prev);
    Animated.timing(bottomSheetAnimValue, {
      toValue: bottomSheetCollapsed ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const bottomSheetHeight = bottomSheetAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['35%', '10%'],
  });

  const searchPlaceholder =
    {
      starting: 'Search starting point',
      ending: 'Search destination',
      stop: 'Search stop point',
    }[mapMode] || 'Search location';
  const canCreate = !!startingPoint && !!endingPoint && !loading;

  return (
    <View style={ridestep3style.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MAP SECTION (top 50%) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MAP SECTION (top 50%) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <View style={ridestep3style.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{html: mapHtml}}
          style={{flex: 1}}
          onMessage={onWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          mixedContentMode="compatibility"
        />

        {/* ── Floating navbar ── */}
        <View style={[rideCreation.floatingNav, { backgroundColor: 'rgba(255,255,255,0.95)', top: 16 }]}>
          <TouchableOpacity style={buttons.back} onPress={prevStep} activeOpacity={0.8}>
            <FontAwesome name="arrow-left" size={14} color="#8c2323" style={{ marginRight: 6 }} />
            <Text style={[buttons.textDark, { fontSize: 14 }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[text.label, { color: '#1a1a1a' }]}>
            {mapMode === 'starting' ? 'START POINT' : mapMode === 'ending' ? 'END POINT' : 'STOPS'}
          </Text>
          <TouchableOpacity
            style={[buttons.row, { paddingVertical: 8, paddingHorizontal: 12 }, !canCreate && buttons.disabled]}
            onPress={handleCreateRide}
            disabled={!canCreate}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={buttons.textSm}>Create</Text>
                <FontAwesome name="check" size={14} color="#fff" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Search card ── */}
        <View style={rideCreation.searchContainer}>
          <View style={[inputs.searchRow, isSearchFocused && inputs.searchRowFocused]}>
            <FontAwesome name="search" size={16} color="#5f6368" style={{ marginRight: 12 }} />
            <TextInput
              style={inputs.location}
              value={localQuery}
              onChangeText={handleLocalChange}
              placeholder={searchPlaceholder}
              placeholderTextColor="#9aa0a6"
              returnKeyType="search"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onSubmitEditing={() => {
                clearTimeout(debounceRef.current);
                handleSearchInputChange(localQuery);
              }}
              editable={!(mapMode === 'stop' && isAddingStop)}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {localQuery.length > 0 && (
              <TouchableOpacity
                onPress={handleClearSearch}
                style={{ padding: 4, marginRight: 8 }}>
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

          {routeLoading && (
            <View style={[feedback.loadingRow, { marginTop: 8 }]}>
              <ActivityIndicator size="small" color="#1e40af" />
              <Text style={[feedback.loadingText, { color: '#1e40af' }]}>
                Drawing route…
              </Text>
            </View>
          )}

          {searchResults?.length > 0 && (
            <ScrollView
              style={[inputs.resultsList, { maxHeight: 220 }]}
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
                  onPress={() => handleSelectLocationAndUpdateMap(item)}
                  disabled={mapMode === 'stop' && isAddingStop}>
                  <View style={{ width: 20, height: 36, justifyContent: 'center', alignItems: 'center' }}>
                    <FontAwesome name="map-marker" size={16} color="#8c2323" />
                  </View>
                  <View style={{ flex: 1 }}>
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
      </View>
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM SHEET PANEL (bottom 50%, collapsible) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Animated.View
        style={[ridestep3style.bottomSheet, {height: bottomSheetHeight}]}>
        {/* Drag handle */}
        <TouchableOpacity
          style={{alignItems: 'center', paddingVertical: 8}}
          onPress={toggleBottomSheet}>
          <View style={ridestep3style.dragHandle} />
        </TouchableOpacity>

        {/* Collapse chevron button */}
        <TouchableOpacity
          style={ridestep3style.collapseButton}
          onPress={toggleBottomSheet}>
          <FontAwesome
            name={bottomSheetCollapsed ? 'chevron-down' : 'chevron-up'}
            size={16}
            color="#8c2323"
          />
        </TouchableOpacity>

        {/* Timeline content (scrollable) */}
        {!bottomSheetCollapsed && (
          <ScrollView
            style={{flex: 1}}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled>
            <RouteTimeline
              startingPoint={startingPoint}
              endingPoint={endingPoint}
              stopPoints={stopPoints}
              onChangeStart={() => { setMapMode('starting'); setLocalQuery(''); }}
              onChangeEnd={() => { setMapMode('ending'); setLocalQuery(''); }}
              onRemoveStop={removeStopPoint}
            />


            {/* Bottom action buttons - 3 column layout */}
            <View
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.md,
                flexDirection: 'row',
                gap: spacing.xs,
              }}>
              {/* Add Stop Button */}
              {mapMode === 'stop' && !isAddingStop && (
                <TouchableOpacity
                  style={[ridestep3style.addStopBtn, {flex: 1}]}
                  onPress={startAddStopPoint}>
                  <FontAwesome name="plus" size={12} color="#8c2323" />
                  <Text style={[ridestep3style.addStopBtnText, {fontSize: 10}]}>
                    Add Stop
                  </Text>
                </TouchableOpacity>
              )}

              {/* Confirm Stop Button (while adding) */}
              {mapMode === 'stop' && isAddingStop && currentStop && (
                <TouchableOpacity
                  style={[
                    ridestep3style.createBtn,
                    {
                      flex: 1,
                      backgroundColor: '#10b981',
                      paddingVertical: 10,
                    },
                    (addingStopLoading || !currentStop) && {opacity: 0.5},
                  ]}
                  onPress={confirmStopPoint}
                  disabled={addingStopLoading || !currentStop}>
                  {addingStopLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <FontAwesome name="check" size={12} color="#fff" />
                      <Text
                        style={[ridestep3style.createBtnText, {fontSize: 10}]}>
                        Confirm
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Finalize Start/End Buttons */}
              {((mapMode === 'starting' && startingPoint) ||
                (mapMode === 'ending' && endingPoint)) && (
                <TouchableOpacity
                  style={[
                    ridestep3style.createBtn,
                    {flex: 1, paddingVertical: 10},
                  ]}
                  onPress={finalizePointSelection}>
                  <FontAwesome name="arrow-right" size={12} color="#fff" />
                  <Text
                    style={[ridestep3style.createBtnText, {fontSize: 10}]}>
                    {mapMode === 'starting' ? 'Set End' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Main Create Ride Button */}
              {startingPoint && endingPoint && !isAddingStop && (
                <TouchableOpacity
                  style={[
                    ridestep3style.createBtn,
                    {flex: 1, paddingVertical: 10},
                    !canCreate && {opacity: 0.5},
                  ]}
                  onPress={handleCreateRide}
                  disabled={!canCreate}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text
                        style={[ridestep3style.createBtnText, {fontSize: 12}]}>
                        🏁 Create
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* ── Instruction pill while placing a stop ── */}
      {mapMode === 'stop' && isAddingStop && (
        <View
          style={{
            position: 'absolute',
            bottom: '55%',
            left: 12,
            right: 12,
            zIndex: 45,
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderRadius: 20,
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}>
          {currentStop ? (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              {addingStopLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome name="map-pin" size={14} color="#10b981" />
              )}
              <Text
                style={{
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: '600',
                  flex: 1,
                }}
                numberOfLines={1}>
                {currentStop.name}
              </Text>
            </View>
          ) : (
            <Text style={{color: '#fff', fontSize: 14, fontWeight: '600'}}>
              📍 Tap on the map to place a stop
            </Text>
          )}
        </View>
      )}

      {/* ── Location Suggestion Modal ── */}
      <LocationSuggestionModal
        visible={showLocationModal && !!step2LocationName && !endingPoint}
        locationName={step2LocationName}
        onUseAsEnd={handleUseStep2Location}
        onDismiss={() => setShowLocationModal(false)}
      />
    </View>
  );
};

export default RideStep3;