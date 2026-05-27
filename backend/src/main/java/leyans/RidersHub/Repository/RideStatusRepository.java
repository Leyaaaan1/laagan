package leyans.RidersHub.Repository;

import leyans.RidersHub.model.RideStatus;
import leyans.RidersHub.model.RideStatusEntry;
import leyans.RidersHub.model.RideStatusEntry.Scope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RideStatusRepository extends JpaRepository<RideStatusEntry, Integer> {

    // ── Current / active status ───────────────────────────────────────────────

    /**
     * Returns the current aggregate status entry for a ride
     * (scope = RIDE, active = true).
     */
    @Query("""
            SELECT e FROM RideStatusEntry e
            WHERE e.generatedRidesId = :rideId
              AND e.scope = 'RIDE'
              AND e.active = true
            ORDER BY e.changedAt DESC
            """)
    Optional<RideStatusEntry> findCurrentRideStatus(@Param("rideId") String rideId);

    /**
     * Returns the current per-rider status entry for one participant
     * (scope = RIDER, active = true).
     */
    @Query("""
            SELECT e FROM RideStatusEntry e
            WHERE e.generatedRidesId = :rideId
              AND e.riderUsername    = :username
              AND e.scope            = 'RIDER'
              AND e.active           = true
            ORDER BY e.changedAt DESC
            """)
    Optional<RideStatusEntry> findCurrentRiderStatus(
            @Param("rideId")   String rideId,
            @Param("username") String username);

    // ── History ───────────────────────────────────────────────────────────────

    /** Full history for a ride, newest first. */
    List<RideStatusEntry> findByGeneratedRidesIdOrderByChangedAtDesc(String generatedRidesId);

    /** History for a single rider inside a ride, newest first. */
    List<RideStatusEntry> findByGeneratedRidesIdAndRiderUsernameOrderByChangedAtDesc(
            String generatedRidesId, String riderUsername);

    // ── Existence checks ──────────────────────────────────────────────────────

    boolean existsByGeneratedRidesIdAndStatus(String generatedRidesId, RideStatus status);

    boolean existsByGeneratedRidesIdAndRiderUsernameAndStatus(
            String generatedRidesId, String riderUsername, RideStatus status);

    // ── Bulk de-activation (called before inserting a new active entry) ───────

    /**
     * Marks all previous active RIDE-scope entries for a ride as inactive.
     * Call this inside the same transaction before saving a new entry.
     */
    @Modifying
    @Query("""
            UPDATE RideStatusEntry e
            SET e.active = false
            WHERE e.generatedRidesId = :rideId
              AND e.scope = 'RIDE'
              AND e.active = true
            """)
    void deactivatePreviousRideEntries(@Param("rideId") String rideId);

    /**
     * Marks all previous active RIDER-scope entries for one participant as
     * inactive.  Call this inside the same transaction before saving a new
     * entry.
     */
    @Modifying
    @Query("""
            UPDATE RideStatusEntry e
            SET e.active = false
            WHERE e.generatedRidesId = :rideId
              AND e.riderUsername    = :username
              AND e.scope            = 'RIDER'
              AND e.active           = true
            """)
    void deactivatePreviousRiderEntries(
            @Param("rideId")   String rideId,
            @Param("username") String username);

    // ── Queries across multiple rides ─────────────────────────────────────────

    /** All rides currently in a given aggregate status (useful for admin views). */
    @Query("""
            SELECT e FROM RideStatusEntry e
            WHERE e.status = :status
              AND e.scope  = 'RIDE'
              AND e.active = true
            """)
    List<RideStatusEntry> findAllActiveRidesByStatus(@Param("status") RideStatus status);

    /** Count of riders who have finished individually inside a ride. */
    @Query("""
            SELECT COUNT(e) FROM RideStatusEntry e
            WHERE e.generatedRidesId = :rideId
              AND e.status           = 'RIDER_FINISHED'
              AND e.scope            = 'RIDER'
              AND e.active           = true
            """)
    long countRiderFinished(@Param("rideId") String rideId);
}