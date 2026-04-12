import React, {useRef, useEffect, useCallback} from 'react';
import {View, ActivityIndicator, Text} from 'react-native';
import {WebView} from 'react-native-webview';
import {useRouteMapLogic} from '../RouteMapLogic';
import {createMapHTML} from './RouteMapHTML';
import feedback from '../../../styles/base/feedback';
import layout from '../../../styles/base/layout';

const RouteMapView = ({
  generatedRidesId,
  startingPoint,
  endingPoint,
  stopPoints = [],
  style,
  isDark = false,
  riderMarkers = {}, // live rider locations keyed by username
  currentUsername = '', // logged-in user's username
  ...restProps
}) => {
  const webViewRef = useRef(null);
  const webViewReadyRef = useRef(false); // true once the WebView's first load completes

  const {
    isLoading,
    routeData,
    error,
    userLocation,
    fetchRouteData,
    handleWebViewLoad,
    handleWebViewMessage,
    handleWebViewError,
    updateUserLocationOnMap,
  } = useRouteMapLogic(generatedRidesId);

  // ─────────────────────────────────────────────────────────────────
  // injectRiderMarkers — stable helper that pushes the markers object
  // into the WebView's window.updateRiderMarkers() function
  // ─────────────────────────────────────────────────────────────────
  const injectRiderMarkers = useCallback((markers, user) => {
    if (!webViewRef.current || !webViewReadyRef.current) return;

    const script = `
      if (typeof window.updateRiderMarkers === 'function') {
        window.updateRiderMarkers(${JSON.stringify(markers)}, ${JSON.stringify(
      user,
    )});
      } else {
        console.warn('updateRiderMarkers not ready yet');
      }
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // FIX: inject rider markers whenever riderMarkers OR currentUsername
  // changes.  The original hook watched routeData/startingPoint/etc.
  // which never changed after initial load — so markers never updated.
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!webViewReadyRef.current) return; // WebView not ready yet — onWebViewLoad will catch this
    console.log(
      '🗺️ riderMarkers changed, injecting:',
      Object.keys(riderMarkers),
    );
    injectRiderMarkers(riderMarkers, currentUsername);
  }, [riderMarkers, currentUsername, injectRiderMarkers]);

  // ─────────────────────────────────────────────────────────────────
  // Push user's own GPS location into the map whenever it changes
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userLocation && webViewRef.current) {
      updateUserLocationOnMap(webViewRef, userLocation);
    }
  }, [userLocation, updateUserLocationOnMap]);

  // ─────────────────────────────────────────────────────────────────
  // Called once the WebView HTML has fully loaded
  // ─────────────────────────────────────────────────────────────────
  const onWebViewLoad = useCallback(() => {
    webViewReadyRef.current = true;

    // Small delay to ensure the Leaflet JS has finished executing
    setTimeout(() => {
      // 1. Load the route polyline + start/end/stop markers
      handleWebViewLoad(
        webViewRef,
        routeData,
        startingPoint,
        endingPoint,
        stopPoints,
        userLocation,
      );

      // 2. Immediately inject any rider markers that arrived before the WebView was ready
      if (Object.keys(riderMarkers).length > 0) {
        console.log(
          '🗺️ WebView ready — injecting',
          Object.keys(riderMarkers).length,
          'pending rider markers',
        );
        injectRiderMarkers(riderMarkers, currentUsername);
      }
    }, 500);
  }, [
    routeData,
    startingPoint,
    endingPoint,
    stopPoints,
    userLocation,
    riderMarkers,
    currentUsername,
    handleWebViewLoad,
    injectRiderMarkers,
  ]);

  const onWebViewMessage = event => {
    handleWebViewMessage(event, err => err, onWebViewLoad);
  };

  if (isLoading) {
    return (
      <View style={[layout.screen, style, layout.center]}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={[feedback.loadingText, {color: isDark ? '#fff' : '#000'}]}>
          Loading route…
        </Text>
      </View>
    );
  }

  if (error && !routeData) {
    return (
      <View style={[layout.screen, style, layout.center]}>
        <Text
          style={[feedback.errorText, {color: isDark ? '#ff6b6b' : '#dc3545'}]}>
          {error}
        </Text>
        <Text
          style={{
            color: isDark ? '#4dabf7' : '#007bff',
            fontSize: 14,
            textDecorationLine: 'underline',
          }}
          onPress={fetchRouteData}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <View style={[layout.screen, style]}>
      <WebView
        ref={webViewRef}
        source={{html: createMapHTML()}}
        style={{flex: 1, backgroundColor: 'transparent'}}
        onLoadEnd={onWebViewLoad}
        onMessage={onWebViewMessage}
        onError={handleWebViewError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        allowsFullscreenVideo={false}
        scalesPageToFit={true}
      />
    </View>
  );
};

export default RouteMapView;
