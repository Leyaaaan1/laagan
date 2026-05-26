package leyans.RidersHub.Repository;


import leyans.RidersHub.model.FinishedRide.PersonalFinishedRide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonalFinishedRideRepository extends JpaRepository<PersonalFinishedRide, Integer> {

    // Get a specific rider's personal record for a ride
    Optional<PersonalFinishedRide> findByRideGeneratedRidesIdAndRiderUsername(
            String generatedRidesId, String riderUsername);

    // Check if a rider already has a personal record (prevents duplicates in autoMarkCheckpoints)
    boolean existsByRideGeneratedRidesIdAndRiderUsername(
            String generatedRidesId, String riderUsername);

    // All personal records for a ride (useful for group summary)
    List<PersonalFinishedRide> findByRideGeneratedRidesId(String generatedRidesId);

    // All rides a specific rider has personally completed
    List<PersonalFinishedRide> findByRiderUsername(String riderUsername);
}