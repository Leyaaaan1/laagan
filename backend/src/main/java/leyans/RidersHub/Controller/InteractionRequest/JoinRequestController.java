package leyans.RidersHub.Controller.InteractionRequest;

import leyans.RidersHub.DTO.Request.JoinDTO.JoinerDto;
import leyans.RidersHub.Service.InteractionRequest.JoinRequestService;
import leyans.RidersHub.Utility.ParticipantUtil;
import leyans.RidersHub.model.Interaction.JoinRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/join-request")
public class JoinRequestController {

    private final JoinRequestService joinRequestService;
    private final ParticipantUtil participantUtil;

    public JoinRequestController(JoinRequestService joinRequestService, ParticipantUtil participantUtil) {
        this.joinRequestService = joinRequestService;
        this.participantUtil = participantUtil;
    }


    @PostMapping("/{inviteToken}")
    public ResponseEntity<?> joinViaInvite(@PathVariable String inviteToken) {
        try {
            JoinRequest created = joinRequestService.joinRideByToken(inviteToken);
            return ResponseEntity.ok(created);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @GetMapping("/{generatedRidesId}")
    public ResponseEntity<List<JoinRequest>> listJoinRequestsByRide(@PathVariable Integer generatedRidesId) {
        List<JoinRequest> joinRequests = participantUtil.listJoinRequestsByRideId(generatedRidesId);
        return ResponseEntity.ok(joinRequests);
    }



    @GetMapping("/{generatedRidesId}/joiners")
    public ResponseEntity<List<JoinerDto>> listJoinersByRide(
            @PathVariable Integer generatedRidesId,
            @RequestParam(required = false) JoinRequest.JoinStatus status) {

        List<JoinerDto> result = joinRequestService.listJoinersByRide(generatedRidesId, status);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/approve/{joinId}")
    public ResponseEntity<JoinRequest> approveJoinRequest(@PathVariable Integer joinId) {
        JoinRequest approved = joinRequestService.approveJoinRequest(joinId);
        return ResponseEntity.ok(approved);
    }

    @PutMapping("/reject/{joinId}")
    public ResponseEntity<JoinRequest> rejectJoinRequest(@PathVariable Integer joinId) {
        JoinRequest rejected = joinRequestService.rejectJoinRequest(joinId);
        return ResponseEntity.ok(rejected);
    }




}
