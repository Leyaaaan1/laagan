package leyans.RidersHub.Repository;

import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.RiderLocation;
import leyans.RidersHub.model.StartedRide;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RiderLocationRepository extends JpaRepository<RiderLocation, Integer> {

    // -------------------------------------------------------------------------
    // Distance helper (PostGIS)
    // -------------------------------------------------------------------------
    @Query(value = "SELECT ST_DistanceSphere(:pointA, :pointB)", nativeQuery = true)
    double getDistanceBetweenPoints(@Param("pointA") Point pointA,
                                    @Param("pointB") Point pointB);

    // -------------------------------------------------------------------------
    // Used by updateLocation() for the UPSERT logic.
    //
    // findFIRSTBy — returns the most recent row (ordered by id DESC) and never
    // throws IncorrectResultSizeDataAccessException even if duplicate rows exist
    // from before the upsert fix was applied.
    // -------------------------------------------------------------------------
    Optional<RiderLocation> findFirstByStartedRideAndUsernameOrderByIdDesc(
            StartedRide startedRide, Rider username);

    // -------------------------------------------------------------------------
    // Cleanup — deletes all OLD duplicate rows for a rider in a ride, keeping
    // only the one with the highest id.  Called once inside updateLocation()
    // after the upsert so the table self-heals over time.
    // -------------------------------------------------------------------------
    @Modifying
    @Query("DELETE FROM RiderLocation rl " +
            "WHERE rl.startedRide = :startedRide " +
            "AND rl.username = :username " +
            "AND rl.id < :latestId")
    void deleteOldDuplicates(@Param("startedRide") StartedRide startedRide,
                             @Param("username") Rider username,
                             @Param("latestId") Integer latestId);

    // -------------------------------------------------------------------------
    // Returns ONE row per rider — the row with the highest id — for the given
    // started ride.  Used by both getAllRiderLocations() and
    // getLatestParticipantLocations().
    //
    // Because updateLocation() now upserts, there will normally be exactly one
    // row per rider anyway, but the MAX(id) sub-select is kept as a safety net.
    // -------------------------------------------------------------------------
    @Query("SELECT rl FROM RiderLocation rl " +
            "JOIN FETCH rl.username " +
            "WHERE rl.startedRide.id = :rideId " +
            "AND rl.id IN (" +
            "   SELECT MAX(r.id) FROM RiderLocation r " +
            "   WHERE r.startedRide.id = :rideId " +
            "   GROUP BY r.username " +
            ") " +
            "ORDER BY rl.timestamp DESC")
    List<RiderLocation> findLatestLocationPerParticipantOptimized(@Param("rideId") Integer rideId);


    // -------------------------------------------------------------------------
    // All rows for a ride, newest first — useful for history / debug
    // -------------------------------------------------------------------------
    @Query("SELECT rl FROM RiderLocation rl " +
            "WHERE rl.startedRide.id = :rideId " +
            "ORDER BY rl.timestamp DESC")
    List<RiderLocation> findAllLocationsByRide(@Param("rideId") Integer rideId);

    // -------------------------------------------------------------------------
    // Latest location across ALL active started rides — used by /all-riders
    // -------------------------------------------------------------------------
    @Query("SELECT rl FROM RiderLocation rl " +
            "INNER JOIN FETCH rl.startedRide sr " +
            "WHERE sr.id IN (" +
            "   SELECT sr2.id FROM StartedRide sr2" +
            ") " +
            "AND rl.id IN (" +
            "   SELECT MAX(r.id) FROM RiderLocation r " +
            "   WHERE r.startedRide.id = rl.startedRide.id " +
            "   GROUP BY r.username " +
            ") " +
            "ORDER BY rl.timestamp DESC")
    List<RiderLocation> findLatestLocationPerAllStartedRides();
}