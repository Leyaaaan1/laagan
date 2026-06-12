import {useEffect, useRef, useState} from 'react';
import {getRideStatus} from '../../../services/startService';

/** * Ride status codes — values must match the backend RideStatus enum strings exactly. */
export const RIDE_STATUS = {
  NOT_STARTED: 'INACTIVE',
  ACTIVE: 'STARTED',
  FINISHED: 'FINISHED',
  STOPPED: 'STOPPED',
  PERSONAL_FINISHED: 'RIDER_FINISHED',
};

const useRideStatus = ({
  generatedRidesId,
  username,
  resolvedCurrentUsername,
  participants,
  isRideStarted = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState({
    isOwner: false,
    hasJoined: false,
    hasPendingRequest: false,
    rideStatus: RIDE_STATUS.NOT_STARTED,
    rideStarted: false,
  });

  const fetchCount = useRef(0);

  // ── Resolve username to a stable STRING primitive ─────────────────────────
  // If username is an object (e.g. { username: 'dako' }), pulling .username
  // here prevents a new object reference from re-triggering effects every render.
  const ownerUsername =
    typeof username === 'object' && username !== null
      ? username?.username
      : username;

  const deriveLocalFlags = () => {
    const isOwner = ownerUsername === resolvedCurrentUsername;
    const hasJoined =
      Array.isArray(participants) &&
      participants.some(p => p.username === resolvedCurrentUsername) &&
      !isOwner;
    return {isOwner, hasJoined};
  };

  const fetchStatus = async () => {
    if (!generatedRidesId) return;
    setLoading(true);
    try {
      const data = await getRideStatus(generatedRidesId);

      const backendStatus = data?.currentStatus;
      const {isOwner, hasJoined} = deriveLocalFlags();

      const currentUserRiderStatus = data?.riderStatuses?.find(
        rs => rs.riderUsername === resolvedCurrentUsername,
      );
      const participantFinished =
        currentUserRiderStatus?.status === RIDE_STATUS.PERSONAL_FINISHED;

      let effectiveStatus = backendStatus || RIDE_STATUS.NOT_STARTED;
      if (
        backendStatus === RIDE_STATUS.ACTIVE &&
        hasJoined &&
        participantFinished
      ) {
        effectiveStatus = RIDE_STATUS.PERSONAL_FINISHED;
      }

      setActionStatus({
        isOwner,
        hasJoined,
        hasPendingRequest: false,
        rideStatus: effectiveStatus,
        rideStarted:
          effectiveStatus === RIDE_STATUS.ACTIVE ||
          effectiveStatus === RIDE_STATUS.PERSONAL_FINISHED,
      });
    } catch (_err) {
      const {isOwner, hasJoined} = deriveLocalFlags();
      setActionStatus({
        isOwner,
        hasJoined,
        hasPendingRequest: false,
        rideStatus: isRideStarted
          ? RIDE_STATUS.ACTIVE
          : RIDE_STATUS.NOT_STARTED,
        rideStarted: isRideStarted ?? false,
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Re-fetch only when ride ID or user identity changes ───────────────────
  // FIX: use ownerUsername (string) instead of username (may be object).
  // An object prop creates a new reference every render → infinite fetch loop.
  useEffect(() => {
    fetchCount.current += 1;
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedRidesId, ownerUsername, resolvedCurrentUsername]);

  // ── Keep isOwner/hasJoined in sync when participants list changes ──────────
  // FIX: derive a stable string key instead of depending on the array reference.
  // A new array reference every render also causes an infinite update loop.
  const participantKey = Array.isArray(participants)
    ? participants.map(p => p.username).join(',')
    : '';

  useEffect(() => {
    setActionStatus(prev => {
      const {isOwner, hasJoined} = deriveLocalFlags();
      return {...prev, isOwner, hasJoined};
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantKey]);

  return {actionStatus, loading, refresh: fetchStatus};
};

export default useRideStatus;
