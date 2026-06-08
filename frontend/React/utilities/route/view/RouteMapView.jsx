import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {View, ActivityIndicator, Text} from 'react-native';
import {WebView} from 'react-native-webview';
import {useRouteMapLogic} from '../RouteMapLogic';
import {createMapHTML} from './RouteMapHTML';
import feedback from '../../../styles/base/feedback';
import layout from '../../../styles/base/layout';

const RouteMapView = forwardRef(
  (
    {
      generatedRidesId,
      startingPoint,
      endingPoint,
      stopPoints = [],
      style,
      isDark = false,
      riderMarkers = {},
      currentUsername = '',
      ...restProps
    },
    ref,
  ) => {
    const webViewRef = useRef(null);
    const webViewReadyRef = useRef(false);

    const {
      isLoading,
      routeData,
      error,
      routeError,
      userLocation,
      fetchRouteData,
      handleWebViewLoad,
      handleWebViewMessage,
      handleWebViewError,
      updateUserLocationOnMap,
    } = useRouteMapLogic(generatedRidesId);

    // ✅ EXPOSE focusOnRider to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        focusOnRider: (latitude, longitude, username) => {
          if (!webViewRef.current || !webViewReadyRef.current) return;
          // JSON.stringify handles all escaping — same pattern used in injectRiderMarkers
          const safeUsername = JSON.stringify(String(username));
          const label = JSON.stringify(String(username).substring(0, 3).toUpperCase());
          const script = `
    (function() {
      if (window.orientMapToPoint) {
        window.orientMapToPoint({ lat: ${latitude}, lng: ${longitude}, name: ${safeUsername} });
        var label = document.getElementById('compass-label');
        if (label) label.textContent = '🏍 ' + ${label};
      } else {
        console.warn('orientMapToPoint not ready');
      }
    })();
    true;
  `;
          webViewRef.current.injectJavaScript(script);
        },

      }),
      [],
    );

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

    useEffect(() => {
      if (!webViewReadyRef.current) return;
      console.log(
        '🗺️ riderMarkers changed, injecting:',
        Object.keys(riderMarkers),
      );
      injectRiderMarkers(riderMarkers, currentUsername);
    }, [riderMarkers, currentUsername, injectRiderMarkers]);

    useEffect(() => {
      if (userLocation && webViewRef.current) {
        updateUserLocationOnMap(webViewRef, userLocation);
      }
    }, [userLocation, updateUserLocationOnMap]);

    const onWebViewLoad = useCallback(() => {
      webViewReadyRef.current = true;
      setTimeout(() => {
        handleWebViewLoad(
          webViewRef,
          routeData,
          startingPoint,
          endingPoint,
          stopPoints,
          userLocation,
        );
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
          <Text
            style={[feedback.loadingText, {color: isDark ? '#fff' : '#000'}]}>
            Loading map…
          </Text>
        </View>
      );
    }

    if (error && !routeData) {
      return (
        <View style={[layout.screen, style, layout.center]}>
          <Text
            style={[
              feedback.errorText,
              {color: isDark ? '#ff6b6b' : '#dc3545'},
            ]}>
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
        {routeError && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              right: 10,
              backgroundColor: '#fef3c7',
              borderLeftWidth: 4,
              borderLeftColor: '#f59e0b',
              padding: 12,
              borderRadius: 6,
              zIndex: 100,
            }}>
            <Text style={{color: '#92400e', fontSize: 13, fontWeight: '600'}}>
              ⚠️ Route unavailable
            </Text>
            <Text style={{color: '#b45309', fontSize: 12, marginTop: 4}}>
              Showing landmarks and starting/ending points only
            </Text>
          </View>
        )}
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
  },
);

export default RouteMapView;
