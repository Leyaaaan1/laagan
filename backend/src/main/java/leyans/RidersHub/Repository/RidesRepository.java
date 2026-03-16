package leyans.RidersHub.Repository;

import jakarta.transaction.Transactional;
import leyans.RidersHub.model.Rides;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RidesRepository extends JpaRepository<Rides, Integer> {

    Optional<Rides> findByGeneratedRidesId(Integer generatedRidesId);

    @Query("SELECT r.routeCoordinates FROM Rides r WHERE r.generatedRidesId = :generatedRidesId")
    String findRouteCoordinatesByGeneratedRidesId(@Param("generatedRidesId") Integer generatedRidesId);

    Page<Rides> findAll(Pageable pageable);

//    List<Rides> findByUsername_Username(String username);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO ride_participants (ride_id, rider_username) VALUES (:rideId, :riderId)", nativeQuery = true)
    void addParticipantToRide(@Param("rideId") Integer rideId, @Param("riderId") Integer riderId);

    @Modifying
    @Transactional
    @Query("UPDATE Rides r SET r.active = false WHERE r.generatedRidesId = :generatedRidesId")
    void deactivateRide(@Param("generatedRidesId") Integer generatedRidesId);


    @Query("SELECT r FROM Rides r " +
            "LEFT JOIN FETCH r.username " +
            "LEFT JOIN FETCH r.riderType " +
            "WHERE r.username.username = :username " +
            "ORDER BY r.generatedRidesId DESC")
    Page<Rides> findByUsername_UsernamePaginated(@Param("username") String username, Pageable pageable);

    @Query("SELECT r FROM Rides r " +
            "LEFT JOIN FETCH r.username " +
            "LEFT JOIN FETCH r.riderType " +
            "ORDER BY r.generatedRidesId DESC")
    Page<Rides> findAllActiveSummary(Pageable pageable);


//    @Query("SELECT r FROM Rides r " +
//            "LEFT JOIN FETCH r.username " +
//            "LEFT JOIN FETCH r.riderType " +
//            "WHERE (r.active = true OR r.active IS NULL) " +
//            "ORDER BY r.date DESC")
//    Page<Rides> findAllActiveSummary(Pageable pageable);
    /**
     * Use for detail views - loads everything needed
     * Single query with all relationships
     */
    @EntityGraph(attributePaths = {
            "username",
            "riderType",
            "participants",
            "stopPoints"
    })
    @Query("SELECT r FROM Rides r WHERE r.generatedRidesId = :generatedRidesId")
    Optional<Rides> findByGeneratedRidesIdWithDetails(@Param("generatedRidesId") Integer generatedRidesId);

    /**
     * Use for map display - only spatial data
     */
    @Query("SELECT r.generatedRidesId, r.ridesName, r.location, r.startingLocation, " +
            "r.endingLocation FROM Rides r WHERE r.active = true")
    List<Object[]> findAllActiveLocations();




}
