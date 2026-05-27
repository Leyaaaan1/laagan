package leyans.RidersHub.model;

/**
 * Represents the lifecycle status of a ride.
 *
 * Transitions:
 *   INACTIVE  ──► STARTED  ──► FINISHED
 *                   │
 *                   └──► STOPPED  (force-stopped by creator before finish)
 *
 * RIDER_FINISHED is a per-rider state stored in RideStatusEntry, not on
 * the aggregate Rides entity.  The aggregate moves to FINISHED only when
 * FinishedRide is persisted (all riders done, or force-finish).
 */
public enum RideStatus {


    INACTIVE,

    STARTED,

    RIDER_FINISHED,

    FINISHED,

    STOPPED
}