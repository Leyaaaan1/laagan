package leyans.RidersHub.Repository;


import leyans.RidersHub.model.RiderProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RiderProfileRepository extends JpaRepository<RiderProfile, Integer> {


    @Query("""
    SELECT rp FROM RiderProfile rp
    JOIN FETCH rp.rider r
    LEFT JOIN FETCH rp.riderTypes
    WHERE r.username = :username
    """)
    Optional<RiderProfile> findByRiderUsernameWithTypes(@Param("username") String username);


    boolean existsByRiderUsername(String username);
}