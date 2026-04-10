package leyans.RidersHub.Controller.InteractionRequest;

import leyans.RidersHub.DTO.Request.JoinDTO.JoinerDto;
import leyans.RidersHub.Service.InteractionRequest.JoinRequestService;
import leyans.RidersHub.Utility.ParticipantUtil;
import leyans.RidersHub.model.Interaction.JoinRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

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
            return ResponseEntity.ok(new JoinerDto(created)); //
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/qr/{inviteToken}")
    public ResponseEntity<?> joinViaQrCode(@PathVariable String inviteToken) {
        try {
            JoinRequest created = joinRequestService.joinRideByToken(inviteToken);
            return ResponseEntity.ok(new JoinerDto(created)); //
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }



    @GetMapping("/{generatedRidesId}")
    public ResponseEntity<List<JoinerDto>> listJoinRequestsByRide(
            @PathVariable String generatedRidesId) {
        List<JoinRequest> joinRequests = participantUtil.listJoinRequestsByRideId(generatedRidesId);
        List<JoinerDto> result = joinRequests.stream()
                .map(JoinerDto::new) //
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/approve/{joinId}")
    public ResponseEntity<JoinerDto> approveJoinRequest(@PathVariable Integer joinId) {
        JoinRequest approved = joinRequestService.approveJoinRequest(joinId);
        return ResponseEntity.ok(new JoinerDto(approved));
    }

    @PutMapping("/reject/{joinId}")
    public ResponseEntity<JoinerDto> rejectJoinRequest(@PathVariable Integer joinId) {
        JoinRequest rejected = joinRequestService.rejectJoinRequest(joinId);
        return ResponseEntity.ok(new JoinerDto(rejected)); //
    }



    @GetMapping("/{generatedRidesId}/joiners")
    public ResponseEntity<List<JoinerDto>> listJoinersByRide(
            @PathVariable String generatedRidesId,
            @RequestParam(required = false) JoinRequest.JoinStatus status) {

        List<JoinerDto> result = joinRequestService.listJoinersByRide(generatedRidesId, status);
        return ResponseEntity.ok(result);
    }




}
