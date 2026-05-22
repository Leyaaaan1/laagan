import {useState, useRef, useEffect} from 'react';

const PILL_DISPLAY_DURATION = 3000; // 3 seconds

/** * Custom hook to manage polling status pill visibility */
export const usePollingStatusPill = (isPolling, pollingError) => {
  const [pillVisible, setPillVisible] = useState(true);
  const pillTimerRef = useRef(null);

  useEffect(() => {
    if (isPolling && !pollingError) {
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
      pillTimerRef.current = setTimeout(
        () => setPillVisible(false),
        PILL_DISPLAY_DURATION,
      );
      setPillVisible(true);
    } else if (pollingError || !isPolling) {
      setPillVisible(true);
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    }

    return () => {
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    };
  }, [isPolling, pollingError]);

  return pillVisible;
};
