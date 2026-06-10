import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {getActiveRide} from '../services/startService';
import {
  checkNetworkStatus
} from '../utilities/offlineUtils';
import {
  saveActiveRide,
  loadCachedActiveRide,
  clearCachedActiveRide,
} from './activeRideStorage'; // ← NEW import

export const RideContext = createContext();

export const RideProvider = ({children}) => {
  const [activeRide, setActiveRideState] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingIntervalRef = useRef(null);
  const isPollingRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Load cached ride from AsyncStorage on first mount so the
  //      "Active Ride" banner is visible immediately, even before the
  //      network fetch finishes — and even when the device is offline.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const initFromCache = async () => {
      const cached = await loadCachedActiveRide();
      if (cached) {
        console.log(
          '📂 [RideContext] Restored active ride from cache:',
          cached.generatedRidesId,
        );
        setActiveRideState(cached);
      }
    };
    initFromCache();
  }, []); // runs once on mount

  // ─────────────────────────────────────────────────────────────────────────
  // NEW: Wrap the state setter so every change is automatically persisted.
  //      Components that call setActiveRide(ride) or setActiveRide(null)
  //      don't need to know about storage at all.
  // ─────────────────────────────────────────────────────────────────────────
  const setActiveRide = useCallback(rideOrUpdater => {
    setActiveRideState(prev => {
      const next =
        typeof rideOrUpdater === 'function'
          ? rideOrUpdater(prev)
          : rideOrUpdater;
      // Fire-and-forget — storage failure must not crash the UI
      saveActiveRide(next);
      return next;
    });
  }, []);

  const fetchActiveRide = useCallback(async (generatedRidesId) => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      // Pass id through to getActiveRide so it can hit the participant endpoint
      const ride = await Promise.race([
        getActiveRide(generatedRidesId),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout after 8s')), 8000),
        ),
      ]);
      setActiveRide(ride);
    } catch (err) {
      const errorMsg = err?.message || String(err);
      if (errorMsg === 'NOT_FOUND' || errorMsg.includes('404')) {
        // No active ride on the server — clear storage too
        setActiveRide(null); // clears cache via the wrapper
        return;
      }

      const networkStatus = await checkNetworkStatus();

      if (!networkStatus.isConnected) {
        return;
      }
      if (
        !errorMsg.includes('timeout') &&
        !errorMsg.includes('10000ms') &&
        errorMsg !== 'SERVER_ERROR' &&
        !errorMsg.includes('500') &&
        !errorMsg.includes('network')
      ) {
        setActiveRide(null);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [activeRide, isRefreshing, setActiveRide]);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) {
      console.log('ℹ️ Polling already active');
      return;
    }

    console.log('▶️ Starting active ride polling...');
    isPollingRef.current = true;

    fetchActiveRide();

    pollingIntervalRef.current = setInterval(() => {
      if (isPollingRef.current) {
        fetchActiveRide();
      }
    }, 10000);
  }, [fetchActiveRide]);

  // ✅ FIXED: Properly stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      isPollingRef.current = false;
      console.log('⏹️ Stopped active ride polling');
    }
  }, []);

  const updateRideParticipants = useCallback(
    newParticipants => {
      setActiveRide(prev => {
        if (!prev) return null;
        return {
          ...prev,
          participants: newParticipants,
        };
      });
    },
    [setActiveRide],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CHANGED: clearActiveRide now also erases the persisted cache so a
  //          stale ride is never shown after the user leaves/finishes.
  // ─────────────────────────────────────────────────────────────────────────
  const clearActiveRide = useCallback(() => {
    setActiveRide(null); // wrapper calls saveActiveRide(null) → removes entry
    clearCachedActiveRide(); // belt-and-suspenders explicit clear
    stopPolling();
  }, [setActiveRide, stopPolling]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return (
    <RideContext.Provider
      value={{
        activeRide,
        setActiveRide, // wrapped setter — also persists
        updateRideParticipants,
        clearActiveRide,
        fetchActiveRide,
        isRefreshing,
        startPolling,
        stopPolling,
      }}>
      {children}
    </RideContext.Provider>
  );
};
