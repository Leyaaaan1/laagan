package leyans.RidersHub.Repository.Auth;

import leyans.RidersHub.model.Interaction.InviteRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository

public interface InviteRequestRepository extends JpaRepository <InviteRequest, Integer> {


    @Query("SELECT i FROM InviteRequest i WHERE i.inviteToken = :inviteToken")
    Optional<InviteRequest> findByInviteToken(@Param("inviteToken") String inviteToken);



    @Query("SELECT i FROM InviteRequest i WHERE i.rides.generatedRidesId = :generatedRidesId")
    List<InviteRequest> findByRides_GeneratedRidesId(@Param("generatedRidesId") Integer generatedRidesId);




}
