import {useState, useEffect, useCallback} from 'react';
import {routeCache} from '../../../services/cache/routeCache';

/** * Hook to fetch route from cache when offline * Used by StartedRide to populate routeDataForMap from cache */
export const useOfflineRouteCache = (generatedRidesId, isOffline) => {
  const [cachedRouteData, setCachedRouteData] = useState(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheError, setCacheError] = useState(null);

  const loadFromCache = useCallback(async () => {
    if (!isOffline || !generatedRidesId) {
      return;
    }

    setCacheLoading(true);
    setCacheError(null);

    try {
      const cached = await routeCache.get(generatedRidesId);

      if (cached) {
        setCachedRouteData(cached);
      } else {
        setCacheError('No cached route available');
      }
    } catch (err) {
      setCacheError(err.message);
    } finally {
      setCacheLoading(false);
    }
  }, [isOffline, generatedRidesId]);

  // Load from cache when going offline
  useEffect(() => {
    loadFromCache();
  }, [loadFromCache]);

  return {
    cachedRouteData,
    cacheLoading,
    cacheError,
    loadFromCache,
  };
};
