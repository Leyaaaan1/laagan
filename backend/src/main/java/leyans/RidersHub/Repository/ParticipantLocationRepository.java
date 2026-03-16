package leyans.RidersHub.Repository;

import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.StartedRide;
import leyans.RidersHub.model.participant.ParticipantLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParticipantLocationRepository extends JpaRepository<ParticipantLocation, Integer> {

    void deleteAllByStartedRide(StartedRide startedRide);

}
