// RouteMapView.jsx
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
      onMapReady,
      ...restProps
    },
    ref,
  ) => {
    const webViewRef = useRef(null);
    const webViewReadyRef = useRef(false);
    const snapshotResolverRef = useRef(null);

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

    // ── Expose methods to parent via ref ─────────────────────────────────────
    useImperativeHandle(
      ref,
      () => ({
        focusOnRider: (latitude, longitude, username) => {
          if (!webViewRef.current || !webViewReadyRef.current) return;
          const safeUsername = JSON.stringify(String(username));
          const label = JSON.stringify(
            String(username).substring(0, 3).toUpperCase(),
          );
          const script = `
        (function() {
          if (window.orientMapToPoint) {
            window.orientMapToPoint({ lat: ${latitude}, lng: ${longitude}, name: ${safeUsername} });
            var label = document.getElementById('compass-label');
            if (label) label.textContent = '🏍 ' + ${label};
          }
        })();
        true;
      `;
          webViewRef.current.injectJavaScript(script);
        },

        // ─── Fit map to show entire route ───
        fitMapToRoute: () => {
          return new Promise(resolve => {
            if (!webViewRef.current || !webViewReadyRef.current) {
              resolve(false);
              return;
            }

            const script = `
          (function() {
            if (window.fitMapToRoute) {
              window.fitMapToRoute();
              true;
            } else {
              false;
            }
          })();
          true;
        `;

            window.fitMapResolve = resolve;

            webViewRef.current.injectJavaScript(script);

            setTimeout(() => {
              if (window.fitMapResolve) {
                window.fitMapResolve(false);
                window.fitMapResolve = null;
              }
            }, 3000);
          });
        },

      }),
      [riderMarkers, currentUsername],
    );

    // ── Inject live rider markers ─────────────────────────────────────────────
    const injectRiderMarkers = useCallback((markers, user) => {
      if (!webViewRef.current || !webViewReadyRef.current) return;
      const script = `
        if (typeof window.updateRiderMarkers === 'function') {
          window.updateRiderMarkers(${JSON.stringify(
            markers,
          )}, ${JSON.stringify(user)});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }, []);

    useEffect(() => {
      if (!webViewReadyRef.current) return;
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
        const script = `
      if (typeof window.loadRouteData === 'function') {
        window.loadRouteData(
          ${JSON.stringify(routeData)},
          ${JSON.stringify(startingPoint)},
          ${JSON.stringify(endingPoint)},
          ${JSON.stringify(stopPoints)},
          ${JSON.stringify(userLocation)}
        );
      }
      
      if (typeof window.fitMapToRoute === 'function') {
        setTimeout(function() {
          window.fitMapToRoute();
        }, 500);
      }
      
      true;
    `;

        webViewRef.current.injectJavaScript(script);

        if (Object.keys(riderMarkers).length > 0) {
          injectRiderMarkers(riderMarkers, currentUsername);
        }

        setTimeout(() => {
          onMapReady?.();
        }, 3000);
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
      onMapReady,
    ]);

    // ── onWebViewMessage ──────────────────────────────────────────────────────
    const onWebViewMessage = useCallback(
      event => {
        try {
          const msg = JSON.parse(event.nativeEvent.data);

          if (msg.type === 'snapshotReady') {
            console.log(
              '[Snapshot] snapshotReady received, dataUri length:',
              msg.dataUri?.length,
            );
            snapshotResolverRef.current?.(msg.dataUri);
            snapshotResolverRef.current = null;
            return;
          }
          if (msg.type === 'snapshotError') {
            console.log('[Snapshot] snapshotError received:', msg.error);
            snapshotResolverRef.current?.(null);
            snapshotResolverRef.current = null;
            return;
          }

          if (msg.type === 'markerError') {
            console.warn('[RouteMapView] marker error:', msg.error);
            return;
          }
        } catch (_) {
          // Not JSON — ignore
        }

        handleWebViewMessage(event, err => err, onWebViewLoad);
      },
      [handleWebViewMessage, onWebViewLoad],
    );

    // ── Loading state ─────────────────────────────────────────────────────────
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

    // ── Fatal error state ─────────────────────────────────────────────────────
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

    // ── Main render ───────────────────────────────────────────────────────────
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
