

import React, {useRef, forwardRef, useImperativeHandle} from 'react';
import {View, StyleSheet} from 'react-native';
import RouteMapView from './RouteMapView';
import OfflineMapView from '../map/view/OfflineMapView';

const AdaptiveMapView = forwardRef(
  (
    {
      isOffline = false,

      // Passed through to both maps unchanged
      generatedRidesId,
      startingPoint,
      endingPoint,
      stopPoints = [],
      routeData = null,
      style,
      isDark = false,
      riderMarkers = {},
      currentUsername = '',

      // Any extra props (e.g. testID) forwarded to the active map
      ...restProps
    },
    ref,
  ) => {
    const onlineRef = useRef(null);
    const offlineRef = useRef(null);

    // ─── Forwarded ref ───────────────────────────────────────────────────────
    // Route the call to whichever map is currently visible.
    useImperativeHandle(
      ref,
      () => ({
        focusOnRider: (latitude, longitude, username) => {
          const target = isOffline ? offlineRef : onlineRef;
          target.current?.focusOnRider(latitude, longitude, username);
        },
      }),
      [isOffline],
    );

    const sharedProps = {
      startingPoint,
      endingPoint,
      stopPoints,
      isDark,
      riderMarkers,
      currentUsername,
      ...restProps,
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    // Both components are always mounted; only the visible one fills the space.
    // `display: 'none'` hides the inactive map without unmounting its WebView.
    return (
      <View style={[styles.container, style]}>
        {isOffline ? (
          <OfflineMapView
            key="offline"
            ref={offlineRef}
            routeData={routeData}
            {...sharedProps}
            style={styles.fill}
          />
        ) : (
          <RouteMapView
            key="online"
            ref={onlineRef}
            generatedRidesId={generatedRidesId}
            {...sharedProps}
            style={styles.fill}
          />
        )}
      </View>
    );
  },
);
// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fill: {
    // Absolute so both maps occupy the same space; only one is visible.
    ...StyleSheet.absoluteFillObject,
  },
  hidden: {
    // display:'none' hides the view but keeps it mounted in memory,
    // preserving WebView state across connectivity changes.
    display: 'none',
  },
});

export default AdaptiveMapView;
