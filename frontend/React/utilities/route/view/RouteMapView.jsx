import React, { useRef, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouteMapLogic } from '../RouteMapLogic';
import { createMapHTML } from './RouteMapHTML';
import feedback from '../../../styles/base/feedback';
import layout from '../../../styles/base/layout';

const RouteMapView = ({
                        generatedRidesId,
                        token,
                        startingPoint,
                        endingPoint,
                        stopPoints = [],
                        style,
                        isDark = false,
                        ...restProps
                      }) => {
  const webViewRef = useRef(null);

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
  } = useRouteMapLogic(generatedRidesId, token);

  useEffect(() => {
    if (userLocation && webViewRef.current) {
      updateUserLocationOnMap(webViewRef, userLocation);
    }
  }, [userLocation]);

  const onWebViewLoad = () => {
    setTimeout(() => {
      handleWebViewLoad(
        webViewRef,
        routeData,
        startingPoint,
        endingPoint,
        stopPoints,
        userLocation
      );
    }, 500);
  };

  const onWebViewMessage = (event) => {
    handleWebViewMessage(event, (error) => error, onWebViewLoad);
  };

  if (isLoading) {
    return (
      <View style={[layout.screen, style, layout.center]}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={[feedback.loadingText, { color: isDark ? '#fff' : '#000' }]}>
          Loading route...
        </Text>
      </View>
    );
  }

  if (error && !routeData) {
    return (
      <View style={[layout.screen, style, layout.center]}>
        <Text style={[feedback.errorText, { color: isDark ? '#ff6b6b' : '#dc3545' }]}>
          {error}
        </Text>
        <Text
          style={{ color: isDark ? '#4dabf7' : '#007bff', fontSize: 14, textDecorationLine: 'underline' }}
          onPress={fetchRouteData}
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <View style={[layout.screen, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: createMapHTML() }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
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