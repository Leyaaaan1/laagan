import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {getActiveRide} from '../services/startService';
import {
  checkNetworkStatus,
  clearNetworkStatusCache,
} from '../utilities/offlineUtils';

export const RideContext = createContext();

export const RideProvider = ({children}) => {
  const [activeRide, setActiveRide] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingIntervalRef = useRef(null);
  const isPollingRef = useRef(false);

  // ✅ FIXED: Fetch active ride from server with timeout abort
  const fetchActiveRide = useCallback(async () => {
    // ✅ NEW: Skip if already fetching (prevent simultaneous requests)
    if (isRefreshing) {
      console.log('⏭️ Skipping concurrent fetch — already refreshing');
      return;
    }

    try {
      setIsRefreshing(true);

      // ✅ NEW: Create abort controller with 8 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const ride = await Promise.race([
          getActiveRide(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout after 8s')), 8000),
          ),
        ]);

        clearTimeout(timeoutId);
        setActiveRide(ride);
        console.log('✅ Active ride refreshed:', ride?.generatedRidesId);
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        throw fetchErr;
      }
    } catch (err) {
      const errorMsg = err?.message || String(err);
      if (errorMsg === 'NOT_FOUND' || errorMsg.includes('404')) return;


      // ✅ Check if offline
      const networkStatus = await checkNetworkStatus();

      if (!networkStatus.isConnected) {
        console.log(
          '📵 Offline — keeping cached activeRide:',
          activeRide?.generatedRidesId,
        );
        return;
      }

      // ✅ Only clear ride if error is NOT a timeout
      if (!errorMsg.includes('timeout') && !errorMsg.includes('10000ms')) {
        setActiveRide(null);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [activeRide]);

  // ✅ FIXED: Only start polling when manually triggered, not on app startup
  const startPolling = useCallback(() => {
    if (isPollingRef.current) {
      console.log('ℹ️ Polling already active');
      return;
    }

    console.log('▶️ Starting active ride polling...');
    isPollingRef.current = true;

    // Fetch immediately
    fetchActiveRide();

    // Then poll every 10 seconds (increased from 5 to reduce server load)
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

  const updateRideParticipants = useCallback(newParticipants => {
    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        participants: newParticipants,
      };
    });
  }, []);

  const clearActiveRide = useCallback(() => {
    setActiveRide(null);
    stopPolling();
  }, [stopPolling]);

  // ✅ CHANGED: Remove auto-polling, let components control it
  // Remove the useEffect that auto-starts polling

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
        setActiveRide,
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
