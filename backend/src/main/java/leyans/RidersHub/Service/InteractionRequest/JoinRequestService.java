package leyans.RidersHub.Service.InteractionRequest;


import jakarta.persistence.EntityNotFoundException;
import leyans.RidersHub.DTO.Request.JoinDTO.JoinerDto;
import leyans.RidersHub.Repository.Auth.JoinRequestRepository;
import leyans.RidersHub.Utility.ParticipantUtil;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.Interaction.InviteRequest;
import leyans.RidersHub.model.Interaction.JoinRequest;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class JoinRequestService {

    private final JoinRequestRepository joinRequestRepository;
    private final ParticipantUtil participantUtil;
    private final RiderUtil riderUtil;
    private final RideParticipantService rideParticipantService;

    public JoinRequestService(JoinRequestRepository joinRequestRepository, ParticipantUtil participantUtil, RiderUtil riderUtil, RideParticipantService rideParticipantService) {
        this.joinRequestRepository = joinRequestRepository;
        this.participantUtil = participantUtil;
        this.riderUtil = riderUtil;
        this.rideParticipantService = rideParticipantService;
    }


    @Transactional
    public JoinRequest joinRideByToken(String inviteToken) {
        String username = riderUtil.getCurrentUsername();

        InviteRequest invite = participantUtil.findInviteByToken(inviteToken);
        participantUtil.validateInviteNotExpired(invite);

        Rides ride = invite.getRides();
        Rider requester = riderUtil.findRiderByUsername(username);

        if (ride.getUsername().getUsername().equals(username)) {
            throw new IllegalStateException("You are the creator of this ride");
        }

        if (participantUtil.hasJoinRequest(ride.getGeneratedRidesId(), username)) {
            throw new IllegalStateException("You are already a participant in this ride");
        }

        joinRequestRepository.findByInviteTokenAndRequester(inviteToken, username)
                .ifPresent(existing -> {
                    if (existing.getJoinStatus() == JoinRequest.JoinStatus.PENDING) {
                        throw new IllegalStateException("You already have a pending join request for this ride");
                    } else if (existing.getJoinStatus() == JoinRequest.JoinStatus.REJECTED) {
                        throw new IllegalStateException("Your join request was rejected");
                    }
                });

        JoinRequest joinRequest = new JoinRequest(ride, requester, inviteToken);
        return joinRequestRepository.save(joinRequest);
    }
    @Transactional(readOnly = true)
    public List<JoinerDto> listJoinersByRide(Integer generatedRidesId, JoinRequest.JoinStatus status) {
        if (status != null) {
            // reuse InviteUtil method that already maps to JoinerDto
            return participantUtil.listJoinersByRideIdAndStatus(generatedRidesId, status);
        }

        // map all join requests to DTOs
        return participantUtil.listJoinRequestsByRideId(generatedRidesId).stream()
                .map(j -> new JoinerDto(j.getRequester().getUsername(), j.getJoinStatus(), j.getRequestedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public JoinRequest approveJoinRequest(Integer joinId) {
        JoinRequest joinRequest = joinRequestRepository.findById(joinId)
                .orElseThrow(() -> new EntityNotFoundException("Join request not found with ID: " + joinId));

        // Validate only ride creator can approve
        String currentUsername = riderUtil.getCurrentUsername();
        participantUtil.validateRideCreator(joinRequest.getGeneratedRidesId().getGeneratedRidesId(), currentUsername);

        if (joinRequest.getJoinStatus() != JoinRequest.JoinStatus.PENDING) {
            throw new IllegalStateException("Can only approve PENDING requests");
        }

        joinRequest.setJoinStatus(JoinRequest.JoinStatus.APPROVED);
        JoinRequest savedRequest = joinRequestRepository.save(joinRequest);

        rideParticipantService.addParticipantToRide(
                joinRequest.getGeneratedRidesId().getGeneratedRidesId(),
                joinRequest.getRequester().getUsername()
        );

        return savedRequest;
    }

    @Transactional
    public JoinRequest rejectJoinRequest(Integer joinId) {
        JoinRequest joinRequest = joinRequestRepository.findById(joinId)
                .orElseThrow(() -> new EntityNotFoundException("Join request not found with ID: " + joinId));

        // Validate only ride creator can reject
        String currentUsername = riderUtil.getCurrentUsername();
        participantUtil.validateRideCreator(joinRequest.getGeneratedRidesId().getGeneratedRidesId(), currentUsername);

        if (joinRequest.getJoinStatus() != JoinRequest.JoinStatus.PENDING) {
            throw new IllegalStateException("Can only reject PENDING requests");
        }

        joinRequest.setJoinStatus(JoinRequest.JoinStatus.REJECTED);
        return joinRequestRepository.save(joinRequest);
    }








}
