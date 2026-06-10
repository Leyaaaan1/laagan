

import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import {createOfflineMapHTML} from '../../view/OfflineMapHTML';

const OfflineMapView = forwardRef(
  (
    {
      startingPoint,
      endingPoint,
      stopPoints = [],
      routeData = null,
      riderMarkers = {},
      currentUsername = '',
      userLocation = null,
      style,
      isDark = false,
    },
    ref,
  ) => {
    const webViewRef = useRef(null);
    const mapReadyRef = useRef(false); // true after 'mapReady' is received
    const routeDataRef = useRef(routeData); // always holds latest routeData
    const offlineReadyRef = useRef(false);
    // Keep routeDataRef in sync
    routeDataRef.current = routeData;

    useEffect(() => {
      routeDataRef.current = routeData;
    }, [routeData]);

    /** Fire-and-forget JS injection. Always appends `; true;` to satisfy WebView. */
    const inject = useCallback(js => {
      if (!webViewRef.current) return;
      webViewRef.current.injectJavaScript(js + '\n; true;');
    }, []);

    const injectRouteData = useCallback(() => {
      if (!webViewRef.current || !mapReadyRef.current) return;
      const currentRouteData = routeDataRef.current;
      if (!currentRouteData) return;

      inject(`
    if (typeof window.displayOfflineRoute === 'function') {
      window.displayOfflineRoute(${JSON.stringify(currentRouteData)});
      console.log('✅ Offline route polygon injected');
    } else {
      console.warn('displayOfflineRoute not available yet');
    }
  `);
    }, [inject]);
 // no longer depends on routeData prop — reads from ref

    // ✅ NEW: Inject route data when routeData changes
    useEffect(() => {
      // Only inject after BOTH mapReady AND offlineMapReady have fired
      if (mapReadyRef.current && offlineReadyRef.current) {
        injectRouteData();
      }
    }, [routeData, injectRouteData]);

    // ─── Ref API (matches RouteMapView) ─────────────────────────────────────

    useImperativeHandle(
      ref,
      () => ({
        /**
         * focusOnRider(latitude, longitude, username)
         * Flies the map to the rider's last-known position and rotates the
         * compass needle — identical behaviour to RouteMapView's implementation.
         */
        focusOnRider: (latitude, longitude, username) => {
          if (!webViewRef.current || !mapReadyRef.current) return;

          const safeUsername = String(username).replace(/'/g, "\\'");
          const label = String(username).substring(0, 3).toUpperCase();

          inject(`
                (function() {
                    if (window.orientMapToPoint) {
                        window.orientMapToPoint({
                            lat: ${latitude},
                            lng: ${longitude},
                            name: '${safeUsername}'
                        });
                        var labelEl = document.getElementById('compass-label');
                        if (labelEl) labelEl.textContent = '🏍 ${label}';
                    } else {
                        // Fallback: plain flyTo without bearing calculation
                        var m = window.getMap && window.getMap();
                        if (m) m.flyTo([${latitude}, ${longitude}], m.getZoom(), {
                            animate: true, duration: 0.8
                        });
                    }
                })();
            `);
        },
      }),
      [inject],
    );

    // ─── Core injection functions ────────────────────────────────────────────

    const injectOfflineData = useCallback(() => {
      if (!webViewRef.current || !mapReadyRef.current) return;

      inject(`
    if (typeof window.loadOfflineData === 'function') {
      window.loadOfflineData(
        ${JSON.stringify(startingPoint)},
        ${JSON.stringify(endingPoint)},
        ${JSON.stringify(stopPoints)},
        null   // userLocation handled separately via injectUserLocation
      );
    }
  `);
    }, [startingPoint, endingPoint, stopPoints, inject]);
    /**
     * injectRiderMarkers
     * Calls window.updateRiderMarkers() — the same function from riderMarkersScript.js
     * that RouteMapView uses, so marker appearance is identical in both maps.
     */
    const injectRiderMarkers = useCallback(() => {
      if (!webViewRef.current || !mapReadyRef.current) return;
      if (Object.keys(riderMarkers).length === 0) return;

      inject(`
            if (typeof window.updateRiderMarkers === 'function') {
                window.updateRiderMarkers(
                    ${JSON.stringify(riderMarkers)},
                    ${JSON.stringify(currentUsername)}
                );
            } else {
                console.warn('updateRiderMarkers not ready yet');
            }
        `);
    }, [riderMarkers, currentUsername, inject]);

    /**
     * injectUserLocation
     * Calls window.updateUserLocation() from userLocationScript.js.
     */
    const injectUserLocation = useCallback(() => {
      if (!webViewRef.current || !mapReadyRef.current) return;
      if (!userLocation) return;

      inject(`
            if (typeof window.updateUserLocation === 'function') {
                window.updateUserLocation(${JSON.stringify(userLocation)});
            }
        `);
    }, [userLocation, inject]);

    // ─── WebView event handlers ──────────────────────────────────────────────

    /**
     * onWebViewMessage
     * Handles messages from inside the WebView.
     * 'mapReady'       → fired by mapInitScript after L.map() succeeds;
     *                    we respond by sending all the data the map needs.
     * 'offlineMapReady'→ fired by offlineLoaderScript after loadOfflineData()
     *                    completes; we inject any rider markers that arrived
     *                    before or during map init.
     */
    const onWebViewMessage = useCallback(
      event => {
        try {
          const message = JSON.parse(event.nativeEvent.data);

          if (message.type === 'mapReady') {
            mapReadyRef.current = true;
            offlineReadyRef.current = false;
            // Small delay mirrors RouteMapView's 500 ms onLoadEnd timeout
            setTimeout(() => {
              injectOfflineData();
            }, 500);
          }

          if (message.type === 'offlineMapReady') {
            offlineReadyRef.current = true;
            injectRiderMarkers();
            // Route data may not have arrived yet — retry a few times
            let attempts = 0;
            const tryInjectRoute = () => {
              if (routeDataRef.current) {
                injectRouteData();
              } else if (attempts < 5) {
                attempts++;
                setTimeout(tryInjectRoute, 600);
              } else {
                console.warn(
                  '⚠️ OfflineMapView: routeData never arrived after 5 attempts',
                );
              }
            };
            setTimeout(tryInjectRoute, 300);
          }
        } catch (err) {
          console.warn('OfflineMapView message parse error:', err);
        }
      },
      [injectOfflineData, injectRiderMarkers, injectRouteData],
    );

    const onWebViewError = useCallback(syntheticEvent => {
      console.error(
        'OfflineMapView WebView error:',
        syntheticEvent.nativeEvent,
      );
    }, []);

    // ─── Reactive effects ────────────────────────────────────────────────────

    // Re-inject rider markers whenever the polling hook delivers new positions
    useEffect(() => {
      if (!mapReadyRef.current) return;
      injectRiderMarkers();
    }, [riderMarkers, injectRiderMarkers]);

    // Update blue-dot when userLocation changes (e.g. from useUserLocation hook)
    useEffect(() => {
      if (!mapReadyRef.current) return;
      injectUserLocation();
    }, [userLocation, injectUserLocation]);

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          source={{html: createOfflineMapHTML()}}
          style={styles.webView}
          onMessage={onWebViewMessage}
          onError={onWebViewError}
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

        {/*
                React Native–side offline banner.
                Sits above the WebView so it's always visible regardless of
                what the WebView is rendering. The WebView also has its own
                inline banner (in OfflineMapHTML) as a fallback.
            */}
        <View style={styles.offlineBanner} pointerEvents="none">
          <Text style={styles.offlineBannerText}>
            📡 Offline —  last-known rider positions shown
          </Text>
        </View>
      </View>
    );
  },
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    // pointerEvents: 'none' set on View so touches pass through to the map
  },
  offlineBannerText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default OfflineMapView;