package leyans.RidersHub.Utility;


import jakarta.persistence.EntityNotFoundException;
import leyans.RidersHub.DTO.Request.JoinDTO.JoinerDto;
import leyans.RidersHub.Repository.Auth.InviteRequestRepository;
import leyans.RidersHub.Repository.Auth.JoinRequestRepository;
import leyans.RidersHub.Service.InteractionRequest.InviteRequestService;
import leyans.RidersHub.model.Interaction.InviteRequest;
import leyans.RidersHub.model.Interaction.JoinRequest;
import leyans.RidersHub.model.Rides;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ParticipantUtil {

    private final InviteRequestService inviteRequestService;
    private final InviteRequestRepository inviteRequestRepository;

    private final JoinRequestRepository joinRequestRepository;
    private final RiderUtil riderUtil;

    public ParticipantUtil(InviteRequestService inviteRequestService, InviteRequestRepository inviteRequestRepository, JoinRequestRepository joinRequestRepository, RiderUtil riderUtil) {
        this.inviteRequestService = inviteRequestService;
        this.inviteRequestRepository = inviteRequestRepository;
        this.joinRequestRepository = joinRequestRepository;
        this.riderUtil = riderUtil;
    }


    public InviteRequest findInviteByToken(String inviteToken) {
        return inviteRequestRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new EntityNotFoundException("Invite not found for token: " + inviteToken));
    }

    public InviteRequest findInviteByRideId(Integer generatedRidesId) {
        List<InviteRequest> invites = inviteRequestRepository.findByRides_GeneratedRidesId(generatedRidesId);
        if (invites == null || invites.isEmpty()) {
            throw new EntityNotFoundException("Invite not found for ride ID: " + generatedRidesId);
        }
        return invites.get(0);
    }

    public void validateInviteNotExpired(InviteRequest invite) {
        if (isExpired(invite)) {
            throw new EntityNotFoundException("Invite expired for ride ID: " +
                    (invite.getRides() != null ? invite.getRides().getGeneratedRidesId() : "unknown"));
        }
    }
    public boolean isExpired(InviteRequest invite) {
        LocalDateTime now = LocalDateTime.now();
        if (invite.getExpiresAt() != null) {
            return invite.getExpiresAt().isBefore(now);
        }
        if (invite.getCreatedAt() != null) {
            return invite.getCreatedAt().plusMonths(1).isBefore(now);
        }
        throw new EntityNotFoundException("Invite missing expiration and creation time for ride ID: " +
                (invite.getRides() != null ? invite.getRides().getGeneratedRidesId() : "unknown"));
    }

    @Transactional(readOnly = true)
    public List<JoinRequest> listJoinRequestsByRideId(Integer generatedRidesId) {
        riderUtil.findRideById(generatedRidesId); // validate existence
        return joinRequestRepository.findByRideId(generatedRidesId);
    }

    public void validateRideCreator(Integer generatedRidesId, String currentUsername) {
        Rides ride = riderUtil.findRideById(generatedRidesId);

        if (!ride.getUsername().getUsername().equals(currentUsername)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only the ride creator can approve/reject join requests"
            );
        }
    }

//    @Transactional(readOnly = true)
//    public List<JoinerDto> listJoinersByRideId(Integer rideId) {
//        return listJoinRequestsByRideId(rideId).stream()
//                .map(j -> new JoinerDto(j.getRequester().getUsername(), j.getJoinStatus(), j.getRequestedAt()))
//                .map(j -> new JoinerDto(j.getRequester().getUsername(), j.getJoinStatus(), j.getRequestedAt()))
//                .collect(Collectors.toList());
//    }

    @Transactional(readOnly = true)
    public boolean hasJoinRequest(Integer rideId, String username) {
        riderUtil.findRideById(rideId); // validate ride existence
        return joinRequestRepository.findByRideId(rideId)
                .stream()
                .anyMatch(joinRequest -> joinRequest.getRequester().getUsername().equals(username));
    }


    @Transactional(readOnly = true)
    public List<JoinerDto> listJoinersByRideIdAndStatus(Integer rideId, JoinRequest.JoinStatus status) {
        Rides ride = riderUtil.findRideById(rideId);
        return joinRequestRepository.findByRideIdAndStatus(rideId, status).stream()
                .map(j -> new JoinerDto(j.getRequester().getUsername(), j.getJoinStatus(), j.getRequestedAt()))
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public String getInviteUrlByRideId(Integer generatedRidesId) {
        InviteRequest invite = findInviteByRideId(generatedRidesId);
        validateInviteNotExpired(invite);
        return invite.getInviteLink();
    }


    @Transactional(readOnly = true)
    public String getQrCodeUrlByRideId(Integer generatedRidesId) {
        InviteRequest invite = findInviteByRideId(generatedRidesId);
        validateInviteNotExpired(invite);
        return invite.getQr();
    }


    @Transactional(readOnly = true)
    public String getQrCodeBase64ByRideId(Integer rideId) {
        InviteRequest invite = findInviteByRideId(rideId);
        validateInviteNotExpired(invite);
        return invite.getQrCodeBase64();
    }




}
