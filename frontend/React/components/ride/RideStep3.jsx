import React, {useEffect, useState} from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import getMapHTML from '../../utilities/mapHTML';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { reverseGeocodeLandmark } from '../../services/rideService';
import {createRouteData, getRoutePreview} from '../../services/RouteService';
import header from '../../styles/base/header';
import buttons from '../../styles/base/buttons';
import layout from '../../styles/base/layout';
import rideCreation from '../../styles/screens/rideCreation';
import feedback from '../../styles/base/feedback';
import inputs from '../../styles/base/inputs';

const RideStep3 = ({
                       mapMode, setMapMode, isSearching, searchResults,
                       handleLocationSelect, webViewRef,
                       startingLatitude, startingLongitude, endingLatitude, endingLongitude,
                       handleMessage, startingPoint, setStartingPoint,
                       endingPoint, setEndingPoint, prevStep, loading, nextStep,
                       handleCreateRide, handleSearchInputChange, searchQuery,
                       stopPoints, setStopPoints, token,
                   }) => {
    const [currentStop, setCurrentStop] = useState(null);
    const [isAddingStop, setIsAddingStop] = useState(false);
    const [addingStopLoading, setAddingStopLoading] = useState(false);
    const [showProgressBar, setShowProgressBar] = useState(true);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [mapDarkMode, setMapDarkMode] = useState(false);
    const [routeLoading, setRouteLoading] = useState(false);



    const drawRoadRoute = async () => {
        if (!startingLatitude || !startingLongitude || !endingLatitude || !endingLongitude) {
            console.log('Missing start or end coordinates for route drawing');
            return;
        }

        setRouteLoading(true);

        try {
            const routeData = createRouteData(
                startingLatitude,
                startingLongitude,
                endingLatitude,
                endingLongitude,
                stopPoints
            );

            const routeGeoJSON = await getRoutePreview(token, routeData);

            if (!routeGeoJSON || !routeGeoJSON.features || routeGeoJSON.features.length === 0) {
                console.warn('No valid route GeoJSON received from backend');
                return;
            }

            if (webViewRef.current) {
                const routeScript = `
                (function() {
                    try {
                        console.log('Executing route drawing script with GeoJSON');
                        const geoJsonData = ${JSON.stringify(routeGeoJSON)};
                        
                        // Clear existing route first
                        if (window.clearRoute) {
                            window.clearRoute();
                        }
                        
                        // Draw route using GeoJSON
                        if (window.drawGeoJsonRoute) {
                            const success = window.drawGeoJsonRoute(geoJsonData, {
                                color: '#1e40af',
                                weight: 4,
                                opacity: 0.8
                            });
                            console.log('GeoJSON route drawing result:', success);
                        } else {
                            console.error('drawGeoJsonRoute function not available');
                        }
                        
                        // Add route markers
                        if (window.addRouteMarkers) {
                            const startCoords = [${startingLatitude}, ${startingLongitude}];
                            const endCoords = [${endingLatitude}, ${endingLongitude}];
                            const stopCoords = ${JSON.stringify(stopPoints.map(stop => [stop.lat, stop.lng]))};
                            
                            window.addRouteMarkers(startCoords, endCoords, stopCoords);
                        }
                        
                        // Fit route to map view
                        if (window.fitGeoJsonRouteToMap) {
                            window.fitGeoJsonRouteToMap(geoJsonData);
                        }
                        
                        true; // Return true for successful execution
                    } catch (error) {
                        console.error('Route drawing script error:', error);
                        false;
                    }
                })();
            `;

                webViewRef.current.injectJavaScript(routeScript);
                console.log('GeoJSON route drawing script injected into WebView');
            } else {
                console.error('WebView ref not available');
            }

        } catch (error) {
            console.error('Error drawing road route:', error);
            // Show user-friendly error message
            if (error.message.includes('Route request failed')) {
                console.error('Backend route service error - check API configuration');
            } else if (error.message.includes('Network request failed')) {
                console.error('Network error - check backend connectivity');
            }
        } finally {
            setRouteLoading(false);
        }
    };
    // Auto-draw route when coordinates change
    useEffect(() => {
        const shouldDrawRoute = startingLatitude && startingLongitude &&
            endingLatitude && endingLongitude &&
            mapMode !== 'starting' && mapMode !== 'ending';

        if (shouldDrawRoute) {
            // Delay to ensure map is ready
            const timeoutId = setTimeout(() => {
                drawRoadRoute();
            }, 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [startingLatitude, startingLongitude, endingLatitude, endingLongitude, stopPoints, mapMode]);

    const startAddStopPoint = () => {
        setMapMode('stop');
        setIsAddingStop(true);
        setCurrentStop(null);
    };

    const handleStopMapMessage = async (event) => {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'mapClick') {
            setCurrentStop({
                lat: data.lat,
                lng: data.lng,
                name: 'Fetching location name...'
            });
            setAddingStopLoading(true);
            const stopName = await reverseGeocodeLandmark(token, data.lat, data.lng);
            setCurrentStop({
                lat: data.lat,
                lng: data.lng,
                name: stopName || `${data.lat}, ${data.lng}`
            });
            setAddingStopLoading(false);
        }
    };

    const confirmStopPoint = () => {
        if (!currentStop) return;
        setStopPoints(prev => [
            ...prev,
            { lat: currentStop.lat, lng: currentStop.lng, name: currentStop.name }
        ]);
        setIsAddingStop(false);
        setCurrentStop(null);
        setMapMode('ending');

        // Redraw route polygon with new stop point
        setTimeout(() => drawRoadRoute(), 500);
    };

    const handleSelectLocationAndUpdateMap = async (item) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lng);

        // Call parent handler which now returns the resolved name
        let resolvedName = null;
        try {
            resolvedName = await handleLocationSelect(item);
        } catch (e) {
            console.warn('Parent handleLocationSelect failed to return name:', e);
        }

        // Fallback: if parent didn't return a name, resolve here so UI shows the name immediately
        if (!resolvedName) {
            try {
                const fallback = await reverseGeocode(token, lat, lon);
                resolvedName = fallback || item.display_name.split(',')[0];
            } catch (err) {
                resolvedName = item.display_name.split(',')[0];
            }
        }

        // Immediately update local UI state for starting/ending point
        if (mapMode === 'starting') {
            setStartingPoint(resolvedName);
        } else if (mapMode === 'ending') {
            setEndingPoint(resolvedName);
        }

        // Center map and update marker
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
            if (window.centerMap && window.updateMarker) {
                window.centerMap(${lat}, ${lon}, 15);
                window.updateMarker(${lat}, ${lon});
            }
            true;
        `);
        }

        // Redraw route polygon if we have both start and end points
        if (endingLatitude && endingLongitude && startingLatitude && startingLongitude) {
            setTimeout(() => drawRoadRoute(), 500);
        }
    };
    const finalizePointSelection = () => {
        if (mapMode === 'starting' && startingPoint) {
            setMapMode('ending');
        } else if (mapMode === 'ending' && endingPoint) {
            setMapMode('stop');
            setTimeout(() => drawRoadRoute(), 300);
        }
    };

    const removeStopPoint = (index) => {
        setStopPoints(prev => prev.filter((_, i) => i !== index));
        setTimeout(() => drawRoadRoute(), 300);
    };

    const handleMapModeChange = (newMode) => {
        setMapMode(newMode);
        // Keep the route polygon when changing modes
    };

    const onWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('WebView message received:', data.type);

            switch (data.type) {
                case 'mapReady':
                    setMapDarkMode(data.isDarkTheme);
                    console.log('Map is ready, redrawing route polygon if needed');
                    // Redraw route polygon if we have coordinates
                    if (startingLatitude && startingLongitude && endingLatitude && endingLongitude) {
                        setTimeout(() => drawRoadRoute(), 1000);
                    }
                    break;
                case 'routeDrawn':
                    console.log('Route drawing result:', data.success);
                    if (!data.success) {
                        console.error('Route drawing failed:', data.error);
                    } else {
                        console.log('Route successfully drawn with', data.coordinateCount, 'points');
                    }
                    break;
                case 'mapError':
                    console.error('Map initialization error:', data.error);
                    break;
                default:
                    if (mapMode === 'stop' && isAddingStop) {
                        handleStopMapMessage(event);
                    } else {
                        handleMessage(event);
                    }
                    if (data.isDarkTheme !== undefined) {
                        setMapDarkMode(data.isDarkTheme);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error parsing WebView message:', error);
        }
    };

    const getPlaceholderText = () => {
        switch (mapMode) {
            case 'starting': return 'Search for starting point';
            case 'ending': return 'Search for destination';
            case 'stop': return 'Search for stop point';
            default: return 'Search location';
        }
    };

    return (
      <View style={layout.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Full-screen Map */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%' }}>
                <WebView
                    ref={webViewRef}
                    source={{ html: getMapHTML(
                            mapMode === 'starting' ? startingLatitude :
                                mapMode === 'ending' ? endingLatitude :
                                    (currentStop ? currentStop.lat : startingLatitude),
                            mapMode === 'starting' ? startingLongitude :
                                mapMode === 'ending' ? endingLongitude :
                                    (currentStop ? currentStop.lng : startingLongitude),
                            mapDarkMode
                        ) }}
                    style={{ flex: 1 }}
                    onMessage={onWebViewMessage}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    mixedContentMode="compatibility"
                />
            </View>

            {/* Navigation Bar */}
            <View style={header.bar}>
                <TouchableOpacity style={buttons.navButton} onPress={prevStep}>
                    <FontAwesome name="arrow-left" size={16} color="#5f6368" style={{ marginRight: 6 }} />
                    <Text style={buttons.textDark}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[buttons.primary, buttons.primary,
                        (!startingPoint || !endingPoint || loading) && buttons.primary]}
                    onPress={handleCreateRide}
                    disabled={!startingPoint || !endingPoint || loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text style={buttons.backButtonText}>Create</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Search Container */}
            <View style={rideCreation.searchContainer}>
              <View style={[inputs.searchRow, isSearchFocused && inputs.searchRowFocused]}>
                <FontAwesome name="search" size={16} color="#5f6368" style={{ marginRight: 12 }} />
                <TextInput
                  style={inputs.location}
                  value={searchQuery}
                  onChangeText={handleSearchInputChange}
                  placeholder={getPlaceholderText()}
                  placeholderTextColor="#9aa0a6"
                  returnKeyType="search"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  editable={mapMode !== 'stop' || !isAddingStop}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => handleSearchInputChange('')} style={{ padding: 4, marginRight: 8 }}>
                    <FontAwesome name="times-circle" size={16} color="#9aa0a6" />
                  </TouchableOpacity>
                )}
              </View>

              {isSearching && (
                <View style={[feedback.loadingRow, { marginTop: 16 }]}>
                  <ActivityIndicator size="small" color="#8c2323" />
                  <Text style={feedback.loadingText}>Finding locations...</Text>
                </View>
              )}

              {routeLoading && (
                <View style={[feedback.loadingRow, { marginTop: 8 }]}>
                  <ActivityIndicator size="small" color="#1e40af" />
                  <Text style={[feedback.loadingText, { color: '#1e40af' }]}>Drawing route...</Text>
                </View>
              )}

              { searchResults && searchResults.length > 0 && (
              <ScrollView style={inputs.resultsList} nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
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
                      <Text style={inputs.resultName}>
                        {item.display_name.split(',')[0]}
                      </Text>
                      <Text style={inputs.resultAddress}>
                        {item.display_name}
                      </Text>
                    </View>
                    <View style={{ justifyContent: 'center' }}>
                      <FontAwesome name="chevron-right" size={14} color="#dadce0" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              )}
            </View>

            {/* Toggle Button */}
            <View style={{ position: 'absolute', top: 120, right: 10, zIndex: 20 }}>
                <TouchableOpacity
                    style={{
                        paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f1f3f4',
                        borderRadius: 16, top: 10, flexDirection: 'row', alignItems: 'center',
                        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4
                    }}
                    onPress={() => setShowProgressBar(prev => !prev)}
                >
                    <FontAwesome name={showProgressBar ? 'eye-slash' : 'eye'} size={16} color="#5f6368" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#5f6368' }}>
                        {showProgressBar ? 'Hide Details' : 'Show Details'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Progress Container */}
            {showProgressBar && (
              <View style={rideCreation.progressContainer}>
                <View style={rideCreation.topRowContainer}>
                  {startingPoint && (
                    <View style={[rideCreation.floatingCard, rideCreation.halfWidthCard]}>
                      <View style={rideCreation.cardHeader}>
                        <View style={rideCreation.cardHeaderLeft}>
                          <Text style={rideCreation.cardTitle}>Starting Point</Text>
                        </View>
                        <TouchableOpacity
                          style={[rideCreation.cardChangeButton, mapMode === 'starting' && { borderWidth: 2 }]}
                          onPress={() => handleMapModeChange('starting')}
                          activeOpacity={0.7}
                        >
                          <Text style={rideCreation.cardChangeButtonText}>Change</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={rideCreation.cardLocationText} numberOfLines={2}>
                        {startingPoint}
                      </Text>
                    </View>
                  )}

                  {endingPoint && (
                    <View style={[rideCreation.floatingCard, rideCreation.halfWidthCard]}>
                      <View style={rideCreation.cardHeader}>
                        <View style={rideCreation.cardHeaderLeft}>
                          <Text style={rideCreation.cardTitle}>Ending Point</Text>
                        </View>
                        <TouchableOpacity
                          style={[rideCreation.cardChangeButton, mapMode === 'ending' && { borderWidth: 2 }]}
                          onPress={() => handleMapModeChange('ending')}
                          activeOpacity={0.7}
                        >
                          <Text style={rideCreation.cardChangeButtonText}>Change</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={rideCreation.cardLocationText} numberOfLines={2}>
                        {endingPoint}
                      </Text>
                    </View>
                  )}
                </View>

                {stopPoints.length > 0 && (
                  <View style={[rideCreation.floatingCard, rideCreation.fullWidthCard]}>
                    <View style={rideCreation.cardHeader}>
                      <View style={rideCreation.cardHeaderLeft}>
                        <Text style={rideCreation.cardTitle}>Stop Points</Text>
                      </View>
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
                          <TouchableOpacity style={{ marginLeft: 8, padding: 4 }} onPress={() => removeStopPoint(index)}>
                            <FontAwesome name="times" size={12} color="#999" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={buttons.actionButtonsContainer}>
                {mapMode === 'stop' && !isAddingStop && (
                    <TouchableOpacity style={[buttons.primary, buttons.primary]} onPress={startAddStopPoint}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <FontAwesome name="plus" size={14} color="#ffffff" />
                            <Text style={buttons.buttonText}> Add Stop Point</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {mapMode === 'stop' && isAddingStop && currentStop && (
                    <TouchableOpacity
                        style={[buttons.button, buttons.success]}
                        onPress={confirmStopPoint}
                        disabled={addingStopLoading}
                    >
                        {addingStopLoading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FontAwesome name="check" size={14} color="#ffffff" />
                                <Text style={buttons.textPrimary}> Confirm Stop Point</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Main Action Container */}
            <View style={rideCreation.mainActionContainer}>
                {((mapMode === 'starting' && startingPoint) || (mapMode === 'ending' && endingPoint)) && (
                    <TouchableOpacity style={[buttons.primary, buttons.textPrimary]} onPress={finalizePointSelection}>
                        <Text style={buttons.textPrimary}>
                            {mapMode === 'starting' ? 'Continue to Destination' : 'Continue to Stop Points'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default RideStep3;