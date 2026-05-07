
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

    @Query("SELECT r FROM Rides r WHERE r.generatedRidesId = :generatedRidesId")
    Optional<Rides> findByGeneratedRidesId(@Param("generatedRidesId") String generatedRidesId);

    @Query("SELECT r.routeCoordinates FROM Rides r WHERE r.generatedRidesId = :generatedRidesId")
    String findRouteCoordinatesByGeneratedRidesId(@Param("generatedRidesId") String generatedRidesId);

    Page<Rides> findAll(Pageable pageable);

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

    @EntityGraph(attributePaths = {
            "username",
            "riderType",
            "participants",
            "stopPoints"
    })
    @Query("SELECT r FROM Rides r WHERE r.generatedRidesId = :generatedRidesId")
    Optional<Rides> findByGeneratedRidesIdWithDetails(@Param("generatedRidesId") String generatedRidesId);
}