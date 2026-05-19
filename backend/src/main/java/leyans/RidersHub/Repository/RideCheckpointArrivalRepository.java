package leyans.RidersHub.Repository;

import leyans.RidersHub.model.RideCheckpointArrival;
import leyans.RidersHub.model.RideCheckpointArrival.CheckpointType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RideCheckpointArrivalRepository extends JpaRepository<RideCheckpointArrival, Integer> {

    // All arrivals for a started ride (useful for building summary)
    List<RideCheckpointArrival> findByStartedRideId(Integer startedRideId);


    @Query("SELECT c FROM RideCheckpointArrival c " +
            "WHERE c.startedRide.ride.generatedRidesId = :generatedRidesId " +
            "ORDER BY c.arrivedAt DESC")
    List<RideCheckpointArrival> findByGeneratedRidesId(
            @Param("generatedRidesId") String generatedRidesId
    );

    // Who arrived at a specific stop point
    List<RideCheckpointArrival> findByStartedRideIdAndCheckpointTypeAndCheckpointIndex(
            Integer startedRideId,
            CheckpointType checkpointType,
            Integer checkpointIndex
    );



    // Who marked themselves as arrived at the ending point
    List<RideCheckpointArrival> findByStartedRideIdAndCheckpointType(
            Integer startedRideId,
            CheckpointType checkpointType
    );

    // Check if a specific rider already marked a checkpoint (prevent duplicates)
    boolean existsByStartedRideIdAndRiderUsernameAndCheckpointTypeAndCheckpointIndex(
            Integer startedRideId,
            String riderUsername,
            CheckpointType checkpointType,
            Integer checkpointIndex
    );

    // Check if a specific rider already marked the ending
    boolean existsByStartedRideIdAndRiderUsernameAndCheckpointType(
            Integer startedRideId,
            String riderUsername,
            CheckpointType checkpointType
    );

    // Count how many riders arrived at the ending point
    @Query("SELECT COUNT(c) FROM RideCheckpointArrival c " +
            "WHERE c.startedRide.id = :startedRideId " +
            "AND c.checkpointType = 'ENDING'")
    long countEndingArrivals(@Param("startedRideId") Integer startedRideId);

    // Delete all checkpoint arrivals for a started ride (used during deactivateRide cleanup)
    void deleteByStartedRideId(Integer startedRideId);
}