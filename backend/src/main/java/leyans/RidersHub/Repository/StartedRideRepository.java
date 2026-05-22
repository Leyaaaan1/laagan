
package leyans.RidersHub.Repository;

import jakarta.transaction.Transactional;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.StartedRide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StartedRideRepository extends JpaRepository<StartedRide, Integer> {

    boolean existsByRide(Rides ride);

    boolean existsByUsername(Rider username);

    Optional<StartedRide> findByRideGeneratedRidesId(String generatedRidesId);

    @Query("SELECT sr FROM StartedRide sr WHERE sr.ride = :ride")
    Optional<StartedRide> findByRide(@Param("ride") Rides ride);

    @Query("SELECT sr FROM StartedRide sr JOIN FETCH sr.ride WHERE sr.username = :username")
    Optional<StartedRide> findByUsernameWithRide(@Param("username") Rider username);

    // Delete participant_location rows by generated_rides_id
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM participant_location WHERE started_ride_id IN (SELECT id FROM started_rides WHERE generated_rides_id = :generatedRidesId)", nativeQuery = true)
    void deleteParticipantLocationsByStartedRideId(@Param("generatedRidesId") String generatedRidesId);

    // Delete started_ride_participants join table by generated_rides_id
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM started_ride_participants WHERE started_ride_id IN (SELECT id FROM started_rides WHERE generated_rides_id = :generatedRidesId)", nativeQuery = true)
    void deleteParticipantsByStartedRideId(@Param("generatedRidesId") String generatedRidesId);

    // Delete rider_locations by generated_rides_id
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM rider_locations WHERE started_ride_id IN (SELECT id FROM started_rides WHERE generated_rides_id = :generatedRidesId)", nativeQuery = true)
    void deleteRiderLocationsByStartedRideId(@Param("generatedRidesId") String generatedRidesId);

    Optional<StartedRide> findByUsername(Rider rider);

    @Query("""
    SELECT s FROM StartedRide s
    JOIN s.participants p
    WHERE p.username = :username
    """)
    Optional<StartedRide> findByParticipantUsername(@Param("username") String username);

    @Query("SELECT s FROM StartedRide s " +
            "LEFT JOIN FETCH s.username " +
            "LEFT JOIN FETCH s.participants " +
            "WHERE s.id = :id")
    Optional<StartedRide> findByIdWithParticipants(@Param("id") Integer id);

    // Delete rider_location by generated_rides_id and rider_username
    @Modifying
    @Transactional
    @Query(value = """
    DELETE FROM rider_locations
    WHERE started_ride_id IN (SELECT id FROM started_rides WHERE generated_rides_id = :generatedRidesId)
      AND rider_username = :username
    """, nativeQuery = true)
    void deleteRiderLocationsByStartedRideIdAndUsername(
            @Param("generatedRidesId") String generatedRidesId,
            @Param("username") String username);

    // Delete participant_location by generated_rides_id and rider username
    @Modifying
    @Transactional
    @Query(value = """
    DELETE FROM participant_location pl
    WHERE pl.started_ride_id IN (SELECT id FROM started_rides WHERE generated_rides_id = :generatedRidesId)
      AND pl.rider_id = (
          SELECT r.id FROM rider r WHERE r.username = :username
      )
    """, nativeQuery = true)
    void deleteParticipantLocationByStartedRideIdAndUsername(
            @Param("generatedRidesId") String generatedRidesId,
            @Param("username") String username);

    // Remove participant from started_ride_participants by generated_rides_id and rider_username
    @Modifying
    @Transactional
    @Query(value = """
    DELETE FROM started_ride_participants
    WHERE started_ride_id IN (SELECT id FROM started_rides WHERE generated_rides_id = :generatedRidesId)
      AND rider_username = :username
    """, nativeQuery = true)
    void removeParticipantFromStartedRide(
            @Param("generatedRidesId") String generatedRidesId,
            @Param("username") String username);
}