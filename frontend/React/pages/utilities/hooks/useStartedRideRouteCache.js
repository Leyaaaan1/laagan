import {useCallback, useEffect, useRef} from 'react';
import {routeCache} from '../../../services/cache/routeCache';

export const useStartedRideRouteCache = activeRide => {
  // Track what we last cached so we skip identical writes
  const lastCachedIdRef = useRef(null);
  const lastCachedCoordinatesRef = useRef(null);

  const cacheRouteData = useCallback(async () => {
    if (!activeRide?.generatedRidesId) return;

    // Skip if nothing meaningful has changed
    if (
      lastCachedIdRef.current === activeRide.generatedRidesId &&
      lastCachedCoordinatesRef.current === activeRide.routeCoordinates
    ) {
      return;
    }

    try {
      const routeData = {
        startLat: activeRide.startLat,
        startLng: activeRide.startLng,
        endLat: activeRide.endLat,
        endLng: activeRide.endLng,
        startingPointName: activeRide.startingPointName,
        endingPointName: activeRide.endingPointName,
        stopPoints: (activeRide.stopPoints || []).map(sp => ({
          lat: sp.stopLatitude || sp.lat,
          lng: sp.stopLongitude || sp.lng,
          name: sp.stopName || sp.name,
        })),
        routeCoordinates: activeRide.routeCoordinates,
      };

      await routeCache.save(activeRide.generatedRidesId, routeData);

      // Record what we just cached
      lastCachedIdRef.current = activeRide.generatedRidesId;
      lastCachedCoordinatesRef.current = activeRide.routeCoordinates;

      console.log('✅ Active ride route cached:', activeRide.generatedRidesId);
    } catch (err) {
      console.warn('[useStartedRideRouteCache] Cache error:', err);
    }
  }, [activeRide]);

  useEffect(() => {
    cacheRouteData();
  }, [cacheRouteData]);
};
