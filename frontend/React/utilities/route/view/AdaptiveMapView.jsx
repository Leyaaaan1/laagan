import React, {useRef, forwardRef, useImperativeHandle} from 'react';
import {View, StyleSheet} from 'react-native';
import RouteMapView from './RouteMapView';
import OfflineMapView from '../map/view/OfflineMapView';
import {useOfflineUserLocation} from '../../../hooks/useOfflineUserLocation';

const AdaptiveMapView = forwardRef(
  (
    {
      isOffline = false,
      generatedRidesId,
      startingPoint,
      endingPoint,
      stopPoints = [],
      routeData = null,
      style,
      isDark = false,
      riderMarkers = {},
      currentUsername = '',
      ...restProps
    },
    ref,
  ) => {
    const onlineRef = useRef(null);
    const offlineRef = useRef(null);
    const containerViewRef = useRef(null);

    const {userLocation: offlineUserLocation} =
      useOfflineUserLocation(isOffline);

    useImperativeHandle(
      ref,
      () => ({
        focusOnRider: (latitude, longitude, username) => {
          const target = isOffline ? offlineRef : onlineRef;
          target.current?.focusOnRider(latitude, longitude, username);
        },
        fitMapToRoute: () => {
          const target = isOffline ? offlineRef : onlineRef;
          return target.current?.fitMapToRoute?.() ?? Promise.resolve(false);
        },
        getContainerRef: () => containerViewRef,

        // ── NEW ──────────────────────────────────────────────────────────────
        applyReroute: coordinatesJson => {
          // Only meaningful on the online map — offline mode shows a cached
          // static route and has no live rerouting.
          onlineRef.current?.applyReroute?.(coordinatesJson);
        },
        clearReroute: () => {
          onlineRef.current?.clearReroute?.();
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

    return (
      <View ref={containerViewRef} style={[styles.container, style]}>
        {isOffline ? (
          <OfflineMapView
            key="offline"
            ref={offlineRef}
            routeData={routeData}
            userLocation={offlineUserLocation}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  hidden: {
    display: 'none',
  },
});

export default AdaptiveMapView;
