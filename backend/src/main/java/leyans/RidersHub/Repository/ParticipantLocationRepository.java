package leyans.RidersHub.Repository;

import org.springframework.data.repository.query.Param;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.StartedRide;
import leyans.RidersHub.model.participant.ParticipantLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ParticipantLocationRepository extends JpaRepository<ParticipantLocation, Integer> {

    void deleteAllByStartedRide(StartedRide startedRide);

    @Query("SELECT pl FROM ParticipantLocation pl " +
            "WHERE pl.startedRide = :startedRide AND pl.rider = :rider")
    List<ParticipantLocation> findByStartedRideAndRider(
            @Param("startedRide") StartedRide startedRide,
            @Param("rider") Rider rider);

}
