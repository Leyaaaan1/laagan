import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import getMapHTML from '../../utilities/mapHTML';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { reverseGeocodeLandmark } from '../../services/rideService';
import { createRouteData, getRoutePreview } from '../../services/RouteService';

import buttons from '../../styles/base/buttons';
import layout from '../../styles/base/layout';
import rideCreation from '../../styles/screens/rideCreation';
import feedback from '../../styles/base/feedback';
import inputs from '../../styles/base/inputs';
import badges from '../../styles/base/badges';
import {
  buildCenterMapScript,
  buildDrawRouteScript,
  buildSearchHandlers,
} from './utilities/RideStepUtils';

const DEFAULT_LAT = 12.8797;
const DEFAULT_LNG = 121.7740;

const MODE_LABELS = { starting: 'Set Start', ending: 'Set Destination', stop: 'Add Stops' };
const MODE_COLORS = { starting: '#22c55e', ending: '#8c2323', stop: '#f59e0b' };

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Start / End location card used inside the details panel. */
const RouteEndpointCard = ({ label, dotColor, point, isActive, onChangePress }) => (
  <View style={[rideCreation.floatingCard, rideCreation.halfWidthCard]}>
    <View style={rideCreation.cardHeader}>
      <View style={[badges.dot, { backgroundColor: dotColor, marginRight: 6 }]} />
      <Text style={rideCreation.cardTitle}>{label}</Text>
      <TouchableOpacity
        style={[rideCreation.cardChangeButton, { marginLeft: 'auto' }]}
        onPress={onChangePress}
      >
        <Text style={[rideCreation.cardChangeButtonText, isActive && { color: dotColor, fontWeight: '700' }]}>
          {isActive ? '● Active' : 'Change'}
        </Text>
      </TouchableOpacity>
    </View>
    <Text style={rideCreation.cardLocationText} numberOfLines={2}>
      {point || 'Not set'}
    </Text>
  </View>
);

/** Row of stop-point chips in the details panel. */
const StopPointsList = ({ stopPoints, onRemove }) => {
  if (!stopPoints.length) { return null; }
  return (
    <View style={[rideCreation.floatingCard, rideCreation.fullWidthCard, { marginTop: 6 }]}>
      <View style={[rideCreation.cardHeader, { marginBottom: 6 }]}>
        <Text style={rideCreation.cardTitle}>Stop Points</Text>
        <View style={rideCreation.stopCounter}>
          <Text style={rideCreation.stopCounterText}>{stopPoints.length}</Text>
        </View>
      </View>
      <ScrollView style={rideCreation.stopScrollView} showsVerticalScrollIndicator={false}>
        {stopPoints.map((stop, index) => (
          <View key={index} style={rideCreation.stopItem}>
            <View style={rideCreation.stopNumber}>
              <Text style={rideCreation.stopNumberText}>{index + 1}</Text>
            </View>
            <Text style={rideCreation.stopName} numberOfLines={1}>{stop.name}</Text>
            <TouchableOpacity style={{ marginLeft: 8, padding: 6 }} onPress={() => onRemove(index)}>
              <FontAwesome name="times" size={12} color="#bbb" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const RideStep3 = ({
                     mapMode, setMapMode, isSearching, searchResults,
                     handleLocationSelect, webViewRef,
                     startingLatitude, startingLongitude, endingLatitude, endingLongitude,
                     handleMessage, startingPoint, setStartingPoint,
                     endingPoint, setEndingPoint, prevStep, loading, nextStep,
                     handleCreateRide, handleSearchInputChange, searchQuery,
                     stopPoints, setStopPoints, token,
                   }) => {
  const [currentStop,       setCurrentStop]       = useState(null);
  const [isAddingStop,      setIsAddingStop]       = useState(false);
  const [addingStopLoading, setAddingStopLoading]  = useState(false);
  const [showDetails,       setShowDetails]        = useState(true);
  const [isSearchFocused,   setIsSearchFocused]    = useState(false);
  const [routeLoading,      setRouteLoading]       = useState(false);

  // ── Local search buffer with shared debounce helper ───────────────────────
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const debounceRef = useRef(null);

  const { handleLocalChange, handleClearSearch } = buildSearchHandlers({
    debounceRef,
    setLocalQuery,
    handleSearchInputChange,
  });

  useEffect(() => { if (!searchQuery) { setLocalQuery(''); } }, [searchQuery]);

  // ── Freeze initial map HTML ───────────────────────────────────────────────
  const mapHtml = useMemo(() => {
    const initLat = parseFloat(startingLatitude) || DEFAULT_LAT;
    const initLng = parseFloat(startingLongitude) || DEFAULT_LNG;
    return getMapHTML(initLat, initLng, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Route drawing ─────────────────────────────────────────────────────────
  const drawRoadRoute = async () => {
    if (!startingLatitude || !startingLongitude || !endingLatitude || !endingLongitude) { return; }
    setRouteLoading(true);
    try {
      const routeData   = createRouteData(startingLatitude, startingLongitude, endingLatitude, endingLongitude, stopPoints);
      const routeGeoJSON = await getRoutePreview(token, routeData);
      if (!routeGeoJSON?.features?.length) { return; }

      webViewRef.current?.injectJavaScript(
        buildDrawRouteScript({
          routeGeoJSON,
          startLat: startingLatitude, startLng: startingLongitude,
          endLat:   endingLatitude,   endLng:   endingLongitude,
          stopPoints,
        }),
      );
    } catch (e) {
      console.error('Route draw error:', e);
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    const bothEndpointsSet = startingLatitude && startingLongitude && endingLatitude && endingLongitude;
    const notPickingEndpoint = mapMode !== 'starting' && mapMode !== 'ending';
    if (!bothEndpointsSet || !notPickingEndpoint) { return; }

    const timer = setTimeout(() => drawRoadRoute(), 1000);
    return () => clearTimeout(timer);
  }, [startingLatitude, startingLongitude, endingLatitude, endingLongitude, stopPoints, mapMode]);

  // ── Stop point handlers ───────────────────────────────────────────────────
  const startAddStopPoint = () => { setMapMode('stop'); setIsAddingStop(true); setCurrentStop(null); };

  const handleStopMapMessage = async (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type !== 'mapClick') { return; }

    setCurrentStop({ lat: data.lat, lng: data.lng, name: 'Fetching…' });
    setAddingStopLoading(true);
    const name = await reverseGeocodeLandmark(token, data.lat, data.lng);
    setCurrentStop({ lat: data.lat, lng: data.lng, name: name || `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}` });
    setAddingStopLoading(false);
  };

  const confirmStopPoint = () => {
    if (!currentStop) { return; }
    setStopPoints(prev => [...prev, { lat: currentStop.lat, lng: currentStop.lng, name: currentStop.name }]);
    setIsAddingStop(false);
    setCurrentStop(null);
    setMapMode('stop');
    setTimeout(() => drawRoadRoute(), 500);
  };

  const removeStopPoint = (index) => {
    setStopPoints(prev => prev.filter((_, i) => i !== index));
    setTimeout(() => drawRoadRoute(), 300);
  };

  const finalizePointSelection = () => {
    if (mapMode === 'starting' && startingPoint)  { setMapMode('ending'); }
    if (mapMode === 'ending'   && endingPoint)    { setMapMode('stop'); setTimeout(() => drawRoadRoute(), 300); }
  };

  // ── Location selection + map update ──────────────────────────────────────
  const handleSelectLocationAndUpdateMap = async (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lng);
    let resolvedName = item.display_name ? item.display_name.split(',')[0].trim() : `${lat}, ${lon}`;

    try {
      const parentName = await handleLocationSelect(item);
      if (parentName) { resolvedName = parentName; }
    } catch (e) {
      console.warn('handleLocationSelect error:', e);
    }

    if (mapMode === 'starting') { setStartingPoint(resolvedName); }
    if (mapMode === 'ending')   { setEndingPoint(resolvedName); }
    setLocalQuery(resolvedName);

    webViewRef.current?.injectJavaScript(buildCenterMapScript(lat, lon));

    if (endingLatitude && endingLongitude && startingLatitude && startingLongitude) {
      setTimeout(() => drawRoadRoute(), 500);
    }
  };

  // ── WebView message router ────────────────────────────────────────────────
  const onWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'mapReady':
          if (startingLatitude && startingLongitude && endingLatitude && endingLongitude) {
            setTimeout(() => drawRoadRoute(), 1000);
          }
          break;
        case 'mapError':
          console.error('Map error:', data.error);
          break;
        default:
          if (mapMode === 'stop' && isAddingStop) { handleStopMapMessage(event); }
          else                                    { handleMessage(event); }
      }
    } catch (e) { console.error(e); }
  };

  const searchPlaceholder = { starting: 'Search starting point', ending: 'Search destination', stop: 'Search stop point' }[mapMode] || 'Search location';
  const canCreate = !!startingPoint && !!endingPoint && !loading;

  return (
    <View style={[layout.screen, { backgroundColor: 'transparent' }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* ── Full-screen map — rendered once, never remounted ── */}
      <View style={rideCreation.mapFill}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
          onMessage={onWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          mixedContentMode="compatibility"
        />
      </View>

      {/* ── Floating navbar ── */}
      <View style={[rideCreation.floatingNav, { backgroundColor: 'transparent', top: 16 }]}>
        <TouchableOpacity style={buttons.back} onPress={prevStep} activeOpacity={0.8}>
          <FontAwesome name="arrow-left" size={14} color="#8c2323" style={{ marginRight: 6 }} />
          <Text style={[buttons.textDark, { fontSize: 14 }]}>Back</Text>
        </TouchableOpacity>

        {/* Active mode pill */}
        <View style={[badges.outlinePrimary, { borderColor: MODE_COLORS[mapMode] || '#8c2323' }]}>
          <View style={[badges.dot, { backgroundColor: MODE_COLORS[mapMode] || '#8c2323' }]} />
          <Text style={[badges.outlinePrimaryText, { color: MODE_COLORS[mapMode] || '#8c2323', marginLeft: 6 }]}>
            {MODE_LABELS[mapMode] || 'Route'}
          </Text>
        </View>

        <TouchableOpacity
          style={[buttons.row, { paddingVertical: 8, paddingHorizontal: 12 }, !canCreate && buttons.disabled]}
          onPress={handleCreateRide}
          disabled={!canCreate}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <><Text style={buttons.textSm}>Create</Text><FontAwesome name="check" size={13} color="#fff" style={{ marginLeft: 6 }} /></>
          }
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={rideCreation.searchContainer}>
        <View style={[isSearchFocused && inputs.searchRowFocused]}>
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
            onSubmitEditing={() => { clearTimeout(debounceRef.current); handleSearchInputChange(localQuery); }}
            editable={!(mapMode === 'stop' && isAddingStop)}
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

        {routeLoading && (
          <View style={[feedback.loadingRow, { marginTop: 8 }]}>
            <ActivityIndicator size="small" color="#1e40af" />
            <Text style={[feedback.loadingText, { color: '#1e40af' }]}>Drawing route…</Text>
          </View>
        )}

        {searchResults?.length > 0 && (
          <ScrollView
            style={[inputs.resultsList, { maxHeight: 200 }]}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {searchResults.map((item, index) => (
              <TouchableOpacity
                key={item.place_id.toString()}
                style={[inputs.resultItem, index === searchResults.length - 1 && inputs.resultItemLast]}
                onPress={() => handleSelectLocationAndUpdateMap(item)}
                disabled={mapMode === 'stop' && isAddingStop}
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

      {/* ── Show/Hide toggle ── */}
      <TouchableOpacity
        style={{
          position: 'absolute', top: 90, right: 12, zIndex: 30,
          backgroundColor: 'transparent', borderRadius: 16,
          paddingVertical: 6, paddingHorizontal: 12,
          flexDirection: 'row', alignItems: 'center',
          shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
        }}
        onPress={() => setShowDetails(prev => !prev)}
      >
        <FontAwesome name={showDetails ? 'eye-slash' : 'eye'} size={14} color="#5f6368" style={{ marginRight: 6 }} />
        <Text style={{ color: '#5f6368', fontSize: 12 }}>{showDetails ? 'Hide' : 'Show'} Details</Text>
      </TouchableOpacity>

      {/* ── Route details panel ── */}
      {showDetails && (
        <View style={{ position: 'absolute', bottom: 110, left: 12, right: 12, zIndex: 40 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: 12 }}>
            <View style={rideCreation.topRowContainer}>
              <RouteEndpointCard
                label="Start"
                dotColor="#22c55e"
                point={startingPoint}
                isActive={mapMode === 'starting'}
                onChangePress={() => setMapMode('starting')}
              />
              <RouteEndpointCard
                label="End"
                dotColor="#8c2323"
                point={endingPoint}
                isActive={mapMode === 'ending'}
                onChangePress={() => setMapMode('ending')}
              />
            </View>
            <StopPointsList stopPoints={stopPoints} onRemove={removeStopPoint} />
          </View>
        </View>
      )}

      {/* ── Bottom action bar ── */}
      <View style={{ position: 'absolute', bottom: 24, left: 12, right: 12, zIndex: 40, flexDirection: 'row', gap: 10, paddingVertical: 12 }}>
        {/* Finalize start or end point */}
        {((mapMode === 'starting' && startingPoint) || (mapMode === 'ending' && endingPoint)) && (
          <TouchableOpacity style={[buttons.primary, { flex: 1 }]} onPress={finalizePointSelection}>
            <Text style={buttons.textPrimary}>
              {mapMode === 'starting' ? 'Set Destination →' : 'Continue to Stops →'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Stop-mode controls */}
        {mapMode === 'stop' && (
          <>
            {!isAddingStop ? (
              <TouchableOpacity
                style={[buttons.outline, { flex: 1, flexDirection: 'row', gap: 8 }]}
                onPress={startAddStopPoint}
                activeOpacity={0.8}
              >
                <FontAwesome name="plus" size={14} color="#8c2323" />
                <Text style={buttons.textDark}>Add Stop</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[buttons.success, { flex: 1, flexDirection: 'row', gap: 8 }, (addingStopLoading || !currentStop) && buttons.disabled]}
                onPress={confirmStopPoint}
                disabled={addingStopLoading || !currentStop}
                activeOpacity={0.85}
              >
                {addingStopLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><FontAwesome name="check" size={14} color="#fff" /><Text style={buttons.textPrimary}>Confirm Stop</Text></>
                }
              </TouchableOpacity>
            )}

            {startingPoint && endingPoint && (
              <TouchableOpacity
                style={[buttons.primary, { flex: 1, flexDirection: 'row', gap: 8 }, !canCreate && buttons.disabled]}
                onPress={handleCreateRide}
                disabled={!canCreate}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><FontAwesome name="flag-checkered" size={14} color="#fff" /><Text style={buttons.textPrimary}>Create Ride</Text></>
                }
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* ── Instruction pill while placing a stop ── */}
      {mapMode === 'stop' && isAddingStop && (
        <View style={{ position: 'absolute', bottom: 100, left: 12, right: 12, zIndex: 45, backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12 }}>
          {currentStop ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {addingStopLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <FontAwesome name="map-pin" size={14} color="#fff" />
              }
              <Text style={rideCreation.instructionText} numberOfLines={1}>{currentStop.name}</Text>
            </View>
          ) : (
            <Text style={rideCreation.instructionText}>
              📍 Tap anywhere on the map to place a stop
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default RideStep3;