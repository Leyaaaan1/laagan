package leyans.RidersHub.Repository;

import leyans.RidersHub.model.participant.ParticipantLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ParticipantLocationRepository extends JpaRepository<ParticipantLocation, Integer> {

    Optional<ParticipantLocation> findByStartedRide_IdAndRider_Username(
            Integer startedRideId, String username);

    @Query(value =
            "SELECT pl.* FROM participant_location pl " +
                    "WHERE pl.started_ride_id = :rideId " +
                    "AND pl.participant_location_id IN (" +
                    "   SELECT MAX(pl2.participant_location_id) " +
                    "   FROM participant_location pl2 " +
                    "   WHERE pl2.started_ride_id = :rideId " +
                    "   GROUP BY pl2.rider_username " +
                    ") ORDER BY pl.last_update DESC",
            nativeQuery = true)
    List<ParticipantLocation> findLatestPerParticipant(@Param("rideId") Integer rideId);

    @Query(value =
            "SELECT pl.* FROM participant_location pl " +
                    "WHERE pl.started_ride_id = :rideId " +
                    "AND pl.participant_location_id IN (" +
                    "   SELECT MAX(pl2.participant_location_id) " +
                    "   FROM participant_location pl2 " +
                    "   WHERE pl2.started_ride_id = :rideId " +
                    "   GROUP BY pl2.rider_username " +
                    ") ORDER BY pl.last_update DESC",
            nativeQuery = true)
    List<ParticipantLocation> findLatestPerParticipantWithinRadius(
            @Param("rideId") Integer rideId);

    @Query(value =
            "SELECT ST_DistanceSphere(" +
                    "ST_SetSRID(ST_MakePoint(:lng1, :lat1), 4326), " +
                    "ST_SetSRID(ST_MakePoint(:lng2, :lat2), 4326))",
            nativeQuery = true)
    double getDistanceBetweenPoints(
            @Param("lat1") double lat1, @Param("lng1") double lng1,
            @Param("lat2") double lat2, @Param("lng2") double lng2);
}