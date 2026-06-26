import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {getActiveRide} from '../services/startService';
import {checkNetworkStatus} from '../utilities/offlineUtils';
import {
  saveActiveRide,
  loadCachedActiveRide,
  clearCachedActiveRide,
} from './activeRideStorage'; // ← NEW import

export const RideContext = createContext();

const toSerializable = ride => {
  if (!ride || typeof ride !== 'object') return ride;
  const out = {...ride};
  for (const key of Object.keys(out)) {
    if (out[key] instanceof Date) {
      out[key] = out[key].toISOString();
    }
  }
  return out;
};
export const RideProvider = ({children, token}) => {
  const [activeRide, setActiveRideState] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingIntervalRef = useRef(null);
  const isPollingRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Load cached ride from AsyncStorage on first mount ONLY when a session
  // exists. Skipping the cache load when there is no token prevents a
  // previous account's ride from flashing on screen before the server
  // fetch returns NOT_FOUND for the new (or logged-out) user.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return; // ← guard: don't restore cache without a session

    const initFromCache = async () => {
      const cached = await loadCachedActiveRide();
      if (cached) {
        setActiveRideState(cached); // show instantly while server confirms
      }
      try {
        await fetchActiveRide(); // always validate against server
      } catch {
        // fetchActiveRide handles its own errors
      }
    };
    initFromCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // still runs only on mount — token guard above handles cold-start

  // ─────────────────────────────────────────────────────────────────────────
  // When the user logs out (token becomes null) immediately wipe the in-
  // memory ride state. The AsyncStorage entry is already cleared by
  // AuthContext._clearStorage, but resetting state here ensures the UI
  // never shows a stale ride after switching accounts in the same session.
  // ─────────────────────────────────────────────────────────────────────────
  const prevTokenRef = useRef(token);
  useEffect(() => {
    const wasLoggedIn = prevTokenRef.current !== null;
    const isNowLoggedOut = token === null;
    if (wasLoggedIn && isNowLoggedOut) {
      setActiveRideState(null);
      stopPolling();
    }
    prevTokenRef.current = token;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
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
      const safeNext = toSerializable(next); // ← NEW
      saveActiveRide(safeNext);
      return safeNext;
    });
  }, []);
  const fetchActiveRide = useCallback(
    async generatedRidesId => {
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
    },
    [activeRide, isRefreshing, setActiveRide],
  );

  const startPolling = useCallback(() => {
    if (isPollingRef.current) {
      return;
    }

    isPollingRef.current = true;

    fetchActiveRide();

    pollingIntervalRef.current = setInterval(() => {
      if (isPollingRef.current) {
        fetchActiveRide();
      }
    }, 10000);
  }, [fetchActiveRide]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      isPollingRef.current = false;
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
