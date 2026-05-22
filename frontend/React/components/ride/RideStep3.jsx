import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Animated,} from 'react-native';
import {WebView} from 'react-native-webview';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import getMapHTML from '../../utilities/mapHTML';
import {buildSearchHandlers} from './utilities/RideStepUtils';
import LocationSuggestionModal from './utilities/LocationSuggestionModal';
import {getInitialMapCoords, drawRoadRoute, confirmStopPoint, removeStopPoint, finalizePointSelection, handleSelectLocationAndUpdateMap, routeWebViewMessage,
  getBottomSheetHeight, getSearchPlaceholder, getFinalizeButtonLabel, getMapModeLabel, canCreateRide,
} from './utilities/RideStep3Utilities';
import text from '../../styles/base/text';
import buttons from '../../styles/base/buttons';
import rideCreation from '../../styles/screens/rideCreation';
import feedback from '../../styles/base/feedback';
import inputs from '../../styles/base/inputs';
import RouteTimeline from './utilities/RouteTimeline';
import ridestep3style from '../../styles/screens/ridestep3style';
import {createMemoCompare} from '../../utilities/propsComparison';


const RideStep3 = ({
  mapMode, setMapMode, isSearching, searchResults, handleLocationSelect, webViewRef, startingLatitude, startingLongitude, endingLatitude, endingLongitude, handleMessage,
  startingPoint,  setStartingPoint, endingPoint, setEndingPoint, prevStep, loading, setEndingLatitude, setEndingLongitude, step2LocationName, step2Latitude, step2Longitude,
  handleCreateRide, handleSearchInputChange, searchQuery, stopPoints, setStopPoints, token,
}) => {
  const [currentStop, setCurrentStop] = useState(null);
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [addingStopLoading, setAddingStopLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [bottomSheetCollapsed, setBottomSheetCollapsed] = useState(false);
  const bottomSheetAnimValue = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef(null);
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const {handleLocalChange, handleClearSearch} = buildSearchHandlers({
    debounceRef,
    setLocalQuery,
    handleSearchInputChange,
  });
  const [locationMode, setLocationMode] = useState(null);

  useEffect(() => {
    if (!searchQuery) {
      setLocalQuery('');
    }
  }, [searchQuery]);

  // ── Frozen map HTML ───────────────────────────────────────────────────────
  const mapHtml = useMemo(() => {
    const lat =
      parseFloat(step2Latitude) || parseFloat(startingLatitude) || 7.0731;
    const lng =
      parseFloat(step2Longitude) || parseFloat(startingLongitude) || 125.6128;
    return getMapHTML(lat, lng, false);
  }, []);
  // ── Route draw callback ───────────────────────────────────────────────────
  const triggerDrawRoute = useCallback(() => {
    drawRoadRoute({
      sLat: parseFloat(startingLatitude),
      sLng: parseFloat(startingLongitude),
      eLat: parseFloat(endingLatitude),
      eLng: parseFloat(endingLongitude),
      stopPoints,
      token,
      webViewRef,
      setRouteLoading,
    });
  }, [
    startingLatitude,
    startingLongitude,
    endingLatitude,
    endingLongitude,
    stopPoints,
    token,
    webViewRef,
  ]);

  // Auto-draw when endpoints / stops change (debounced)
  useEffect(() => {
    const bothSet =
      startingLatitude &&
      startingLongitude &&
      endingLatitude &&
      endingLongitude;
    const notPicking = mapMode !== 'starting' && mapMode !== 'ending';
    if (!bothSet || !notPicking) {
      return;
    }
    const timer = setTimeout(triggerDrawRoute, 1000);
    return () => clearTimeout(timer);
  }, [
    startingLatitude,
    startingLongitude,
    endingLatitude,
    endingLongitude,
    stopPoints,
    mapMode,
  ]);

  // ── Step-2 location shortcut ──────────────────────────────────────────────
  // REPLACE the existing handleUseStep2Location function:
  const handleUseStep2Location = () => {
    if (step2LocationName && step2Latitude && step2Longitude) {
      setEndingPoint(step2LocationName);
      setEndingLatitude(step2Latitude);
      setEndingLongitude(step2Longitude);
      setMapMode('starting');
      // Pan map to the suggested location
      webViewRef.current?.injectJavaScript(
        `map.setView([${parseFloat(step2Latitude)}, ${parseFloat(
          step2Longitude,
        )}], 14); true;`,
      );
    }
    setLocationMode('suggested');
    setShowLocationModal(false);
  };
  // ── Stop handlers ─────────────────────────────────────────────────────────
  const startAddStopPoint = () => {
    setMapMode('stop');
    setIsAddingStop(true);
    setCurrentStop(null);
  };

  const handleConfirmStop = () =>
    confirmStopPoint({
      currentStop,
      setStopPoints,
      setIsAddingStop,
      setCurrentStop,
      setMapMode,
      onRouteReady: triggerDrawRoute,
    });

  const handleRemoveStop = index =>
    removeStopPoint(index, setStopPoints, triggerDrawRoute);

  // ── Finalize start / end selection ───────────────────────────────────────
  // REPLACE the existing handleFinalizePoint function:
  const handleFinalizePoint = () => {
    if (mapMode === 'starting' && startingPoint) {
      // If ending is already set (suggested location flow), skip to stop mode
      if (endingPoint) {
        setMapMode('stop');
        setLocalQuery('');
        setTimeout(triggerDrawRoute, 500);
      } else {
        setMapMode('ending');
        setLocalQuery('');
      }
    } else if (mapMode === 'ending' && endingPoint) {
      setMapMode('stop');
      setLocalQuery('');
      setTimeout(triggerDrawRoute, 500);
    }
  };
  // ── Location select from search ───────────────────────────────────────────
  const handleSearchResultSelect = item =>
    handleSelectLocationAndUpdateMap({
      item,
      mapMode,
      handleLocationSelect,
      setStartingPoint,
      setEndingPoint,
      setLocalQuery,
      webViewRef,
      startingLatitude,
      startingLongitude,
      endingLatitude,
      endingLongitude,
      onRouteReady: triggerDrawRoute,
    });

  // ── WebView message router ────────────────────────────────────────────────
  const onWebViewMessage = event =>
    routeWebViewMessage({
      event,
      mapMode,
      isAddingStop,
      startingLatitude,
      startingLongitude,
      endingLatitude,
      endingLongitude,
      onRouteReady: triggerDrawRoute,
      handleMessage,
      setCurrentStop,
      setAddingStopLoading,
    });

  // ── Bottom sheet ──────────────────────────────────────────────────────────
  const toggleBottomSheet = () => {
    setBottomSheetCollapsed(prev => !prev);
    Animated.timing(bottomSheetAnimValue, {
      toValue: bottomSheetCollapsed ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const bottomSheetHeight = getBottomSheetHeight(bottomSheetAnimValue);

  // ── Derived values ────────────────────────────────────────────────────────
  const searchPlaceholder = getSearchPlaceholder(mapMode);
  const modeLabel = getMapModeLabel(mapMode);
  const finalizeLabel = getFinalizeButtonLabel(mapMode);
  const canCreate = canCreateRide(startingPoint, endingPoint, loading);

  const showFinalizeBtn =
    (mapMode === 'starting' && startingPoint) ||
    (mapMode === 'ending' && endingPoint);

  return (
    <View style={ridestep3style.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MAP SECTION */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <View style={ridestep3style.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{html: mapHtml}}
          style={ridestep3style.webView}
          onMessage={onWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          mixedContentMode="compatibility"
        />

        {/* ── Floating navbar ── */}

        <View style={rideCreation.floatingNav}>
          <TouchableOpacity
            style={buttons.back}
            onPress={prevStep}
            activeOpacity={0.8}>
            <FontAwesome name="arrow-left" size={14} color="#8c2323" />
            <Text
              style={[buttons.textDark, ridestep3style.floatingNavBackText]}>
              Back
            </Text>
          </TouchableOpacity>

          <Text style={[text.label, ridestep3style.floatingNavModeLabel]}>
            {modeLabel}
          </Text>

          <TouchableOpacity
            style={[
              buttons.row,
              ridestep3style.floatingNavCreateBtn,
              !canCreate && buttons.disabled,
            ]}
            onPress={handleCreateRide}
            disabled={!canCreate}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={buttons.textSm}>Create</Text>
                <FontAwesome name="check" size={14} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>


        {/* ── Search card ── */}
        <View style={rideCreation.searchContainer}>
          <View
            style={[
              inputs.searchRow,
              isSearchFocused && inputs.searchRowFocused,
            ]}>
            <FontAwesome name="search" size={16} color="#5f6368" />
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
                style={ridestep3style.searchClearBtn}>
                <FontAwesome name="times-circle" size={16} color="#9aa0a6" />
              </TouchableOpacity>
            )}
          </View>

          {isSearching && (
            <View
              style={[feedback.loadingRow, ridestep3style.searchLoadingRow]}>
              <ActivityIndicator size="small" color="#8c2323" />
              <Text style={feedback.loadingText}>Finding locations…</Text>
            </View>
          )}

          {routeLoading && (
            <View style={[feedback.loadingRow, ridestep3style.routeLoadingRow]}>
              <ActivityIndicator size="small" color="#1e40af" />
              <Text
                style={[feedback.loadingText, ridestep3style.routeLoadingText]}>
                Drawing route…
              </Text>
            </View>
          )}

          {searchResults?.length > 0 && (
            <ScrollView
              style={[inputs.resultsList, ridestep3style.searchResultsList]}
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
                  onPress={() => handleSearchResultSelect(item)}
                  disabled={mapMode === 'stop' && isAddingStop}>
                  <View style={ridestep3style.searchResultIconWrapper}>
                    <FontAwesome name="map-marker" size={16} color="#8c2323" />
                  </View>
                  <View style={ridestep3style.routeRowContentWrapper}>
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
      {/* BOTTOM SHEET PANEL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Animated.View
        style={[ridestep3style.bottomSheet, {height: bottomSheetHeight}]}>
        {/* Drag handle */}
        <TouchableOpacity
          style={ridestep3style.dragHandleTouchable}
          onPress={toggleBottomSheet}>
          <View style={ridestep3style.dragHandle} />
        </TouchableOpacity>

        {/* Collapse chevron */}
        <TouchableOpacity
          style={ridestep3style.collapseButton}
          onPress={toggleBottomSheet}>
          <FontAwesome
            name={bottomSheetCollapsed ? 'chevron-down' : 'chevron-up'}
            size={16}
            color="#8c2323"
          />
        </TouchableOpacity>

        {/* Timeline + action buttons */}
        {!bottomSheetCollapsed && (
          <ScrollView
            style={ridestep3style.bottomSheetScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled>
            <RouteTimeline
              startingPoint={startingPoint}
              endingPoint={endingPoint}
              stopPoints={stopPoints}
              onChangeStart={() => {
                setMapMode('starting');
                setLocalQuery('');
              }}
              onChangeEnd={() => {
                setMapMode('ending');
                setLocalQuery('');
              }}
              onRemoveStop={handleRemoveStop}
              mapMode={mapMode}
            />

            <View style={ridestep3style.bottomActionsRow}>
              {mapMode === 'stop' && !isAddingStop && (
                <TouchableOpacity
                  style={[
                    ridestep3style.addStopBtn,
                    ridestep3style.actionBtnFlex,
                  ]}
                  onPress={startAddStopPoint}>
                  <FontAwesome name="plus" size={12} color="#8c2323" />
                  <Text style={ridestep3style.addStopBtnText}>Add Stop</Text>
                </TouchableOpacity>
              )}

              {mapMode === 'stop' && isAddingStop && currentStop && (
                <TouchableOpacity
                  style={[
                    ridestep3style.confirmStopBtn,
                    (addingStopLoading || !currentStop) &&
                      ridestep3style.confirmStopBtnDisabled,
                  ]}
                  onPress={handleConfirmStop}
                  disabled={addingStopLoading || !currentStop}>
                  {addingStopLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <FontAwesome name="check" size={12} color="#fff" />
                      <Text style={ridestep3style.createBtnText}>Confirm</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {showFinalizeBtn && (
                <TouchableOpacity
                  style={[
                    ridestep3style.createBtn,
                    ridestep3style.actionBtnFlex,
                  ]}
                  onPress={handleFinalizePoint}>
                  <FontAwesome name="arrow-right" size={12} color="#fff" />
                  <Text style={ridestep3style.createBtnText}>
                    {finalizeLabel}
                  </Text>
                </TouchableOpacity>
              )}

              {startingPoint && endingPoint && !isAddingStop && (
                <TouchableOpacity
                  style={[
                    ridestep3style.createBtn,
                    ridestep3style.actionBtnFlex,
                    !canCreate && ridestep3style.confirmStopBtnDisabled,
                  ]}
                  onPress={handleCreateRide}
                  disabled={!canCreate}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={ridestep3style.createBtnText}>🏁 Create</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* ── Instruction pill while placing a stop ── */}
      {mapMode === 'stop' && isAddingStop && (
        <View style={ridestep3style.instructionPill}>
          {currentStop ? (
            <View style={ridestep3style.instructionPillRow}>
              {addingStopLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome name="map-pin" size={14} color="#10b981" />
              )}
              <Text
                style={ridestep3style.instructionPillText}
                numberOfLines={1}>
                {currentStop.name}
              </Text>
            </View>
          ) : (
            <Text style={ridestep3style.instructionPillPrompt}>
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
        onDismiss={() => {
          setLocationMode('manual');
          setShowLocationModal(false);
        }}
      />
    </View>
  );
};

export default React.memo(
  RideStep3,
  createMemoCompare([
    // List all the setter/callback props that are always new references
    'setMapMode',
    'handleLocationSelect',
    'setStartingPoint',
    'setEndingPoint',
    'setEndingLatitude',
    'setEndingLongitude',
    'handleCreateRide',
    'handleSearchInputChange',
    'setStopPoints',
    'handleMessage',
  ]),
);