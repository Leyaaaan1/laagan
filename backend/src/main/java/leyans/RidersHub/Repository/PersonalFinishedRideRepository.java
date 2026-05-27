
package leyans.RidersHub.Repository;

import leyans.RidersHub.model.FinishedRide.PersonalFinishedRide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonalFinishedRideRepository extends JpaRepository<PersonalFinishedRide, Integer> {

    // Get a specific rider's personal record for a ride
    @Query("SELECT p FROM PersonalFinishedRide p " +
            "WHERE p.ride.generatedRidesId = :generatedRidesId " +
            "AND LOWER(p.rider.username) = LOWER(:riderUsername)")
    Optional<PersonalFinishedRide> findByRideGeneratedRidesIdAndRiderUsername(
            @Param("generatedRidesId") String generatedRidesId,
            @Param("riderUsername") String riderUsername);

    // Check if a rider already has a personal record (prevents duplicates)
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
            "FROM PersonalFinishedRide p " +
            "WHERE p.ride.generatedRidesId = :generatedRidesId " +
            "AND LOWER(p.rider.username) = LOWER(:riderUsername)")
    boolean existsByRideGeneratedRidesIdAndRiderUsername(
            @Param("generatedRidesId") String generatedRidesId,
            @Param("riderUsername") String riderUsername);

    // All personal records for a ride (useful for group summary)
    List<PersonalFinishedRide> findByRideGeneratedRidesId(String generatedRidesId);

    // All rides a specific rider has personally completed
    List<PersonalFinishedRide> findByRiderUsername(String riderUsername);
}