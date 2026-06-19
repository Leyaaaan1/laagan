package leyans.RidersHub.Repository;

import leyans.RidersHub.model.FinishedRide.FinishedRide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FinishedRideRepository extends JpaRepository<FinishedRide, Integer> {

    Optional<FinishedRide> findByRideGeneratedRidesId(String generatedRidesId);


    boolean existsByRideGeneratedRidesId(String generatedRidesId);
}
