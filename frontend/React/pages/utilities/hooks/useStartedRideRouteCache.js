import {useCallback, useEffect} from 'react';
import {routeCache} from '../../../services/cache/routeCache';

export const useStartedRideRouteCache = activeRide => {
  const cacheRouteData = useCallback(async () => {
    if (!activeRide?.generatedRidesId) {
      console.log('⏭️ No activeRide to cache');
      return;
    }

    try {
      // ✅ FIXED: Save the complete route data including GeoJSON
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
        // ✅ CRITICAL: Save the full GeoJSON routeCoordinates
        routeCoordinates: activeRide.routeCoordinates,
      };

      console.log('💾 Caching route data:', {
        id: activeRide.generatedRidesId,
        hasRouteCoordinates: !!activeRide.routeCoordinates,
      });

      await routeCache.save(activeRide.generatedRidesId, routeData);
      console.log('✅ Active ride route cached:', activeRide.generatedRidesId);
    } catch (err) {
      console.warn('[useStartedRideRouteCache] Cache error:', err);
    }
  }, [activeRide]);

  // Auto-cache on activeRide change
  useEffect(() => {
    cacheRouteData();
  }, [activeRide?.generatedRidesId, cacheRouteData]);
};