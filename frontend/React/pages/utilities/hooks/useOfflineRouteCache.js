import {useState, useEffect, useCallback} from 'react';
import {routeCache} from '../../../services/cache/routeCache';

/** * Hook to fetch route from cache when offline * Used by StartedRide to populate routeDataForMap from cache */
export const useOfflineRouteCache = (generatedRidesId, isOffline) => {
  const [cachedRouteData, setCachedRouteData] = useState(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheError, setCacheError] = useState(null);

  const loadFromCache = useCallback(async () => {
    if (!isOffline || !generatedRidesId) {
      console.log('⏭️ Not loading from cache:', {
        isOffline,
        hasId: !!generatedRidesId,
      });
      return;
    }

    setCacheLoading(true);
    setCacheError(null);

    try {
      console.log('📦 Loading route from cache:', generatedRidesId);
      const cached = await routeCache.get(generatedRidesId);

      if (cached) {
        console.log('✅ Route loaded from cache:', cached);
        setCachedRouteData(cached);
      } else {
        console.warn('❌ No cached route found for:', generatedRidesId);
        setCacheError('No cached route available');
      }
    } catch (err) {
      console.error('❌ Cache load error:', err);
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
