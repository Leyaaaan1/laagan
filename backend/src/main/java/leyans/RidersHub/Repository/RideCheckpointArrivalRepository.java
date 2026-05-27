package leyans.RidersHub.Repository;

import leyans.RidersHub.model.participant.RideCheckpointArrival;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideCheckpointArrivalRepository extends JpaRepository<RideCheckpointArrival, Integer> {

    // All arrivals for a ride — used for summary and checkpoint modal
    @Query("SELECT c FROM RideCheckpointArrival c " +
            "WHERE c.ride.generatedRidesId = :generatedRidesId " +
            "ORDER BY c.arrivedAt ASC")
    List<RideCheckpointArrival> findByRideGeneratedRidesId(
            @Param("generatedRidesId") String generatedRidesId
    );


    @Query("SELECT c FROM RideCheckpointArrival c " +
            "WHERE c.ride.generatedRidesId = :generatedRidesId " +
            "AND LOWER(c.rider.username) = LOWER(:riderUsername) " +
            "AND c.checkpointType = :checkpointType")
    List<RideCheckpointArrival> findByRideGeneratedRidesIdAndRiderUsernameAndCheckpointType(
            @Param("generatedRidesId") String generatedRidesId,
            @Param("riderUsername") String riderUsername,
            @Param("checkpointType") RideCheckpointArrival.CheckpointType checkpointType
    );


    // All arrivals for a ride filtered by checkpoint type
    @Query("SELECT c FROM RideCheckpointArrival c " +
            "WHERE c.ride.generatedRidesId = :generatedRidesId " +
            "AND c.checkpointType = :checkpointType")
    List<RideCheckpointArrival> findByRideGeneratedRidesIdAndCheckpointType(
            @Param("generatedRidesId") String generatedRidesId,
            @Param("checkpointType") RideCheckpointArrival.CheckpointType checkpointType
    );

    // Count riders at a specific checkpoint type (e.g. how many reached ENDING)
    @Query("SELECT COUNT(c) FROM RideCheckpointArrival c " +
            "WHERE c.ride.generatedRidesId = :generatedRidesId " +
            "AND c.checkpointType = :checkpointType")
    long countByRideGeneratedRidesIdAndCheckpointType(
            @Param("generatedRidesId") String generatedRidesId,
            @Param("checkpointType") RideCheckpointArrival.CheckpointType checkpointType
    );

    // Count distinct riders who have any arrival recorded (used for completion status)
    @Query("SELECT COUNT(DISTINCT c.rider.username) FROM RideCheckpointArrival c " +
            "WHERE c.ride.generatedRidesId = :generatedRidesId")
    long countDistinctRidersByGeneratedRidesId(
            @Param("generatedRidesId") String generatedRidesId
    );

    // Check if a specific rider already arrived at a stop point (prevents duplicates)
    @Query("SELECT COUNT(c) > 0 FROM RideCheckpointArrival c " +
            "WHERE c.ride.generatedRidesId = :generatedRidesId " +
            "AND c.rider.username = :riderUsername " +
            "AND c.checkpointType = :checkpointType " +
            "AND c.checkpointIndex = :checkpointIndex")
    boolean existsByRideGeneratedRidesIdAndRiderUsernameAndCheckpointTypeAndCheckpointIndex(
            @Param("generatedRidesId") String generatedRidesId,
            @Param("riderUsername") String riderUsername,
            @Param("checkpointType") RideCheckpointArrival.CheckpointType checkpointType,
            @Param("checkpointIndex") Integer checkpointIndex
    );

    // Check if a specific rider already arrived at a checkpoint type (e.g. ENDING)
    @Query("SELECT COUNT(c) > 0 FROM RideCheckpointArrival c " +
            "WHERE c.ride.generatedRidesId = :generatedRidesId " +
            "AND c.rider.username = :riderUsername " +
            "AND c.checkpointType = :checkpointType")
    boolean existsByRideGeneratedRidesIdAndRiderUsernameAndCheckpointType(
            @Param("generatedRidesId") String generatedRidesId,
            @Param("riderUsername") String riderUsername,
            @Param("checkpointType") RideCheckpointArrival.CheckpointType checkpointType
    );
}