package leyans.RidersHub.Controller.InteractionRequest;


import leyans.RidersHub.Utility.ParticipantUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/invite-request")
public class InviteRequestController {

    private final ParticipantUtil participantUtil;


    public InviteRequestController(ParticipantUtil participantUtil) {
        this.participantUtil = participantUtil;
    }

    @GetMapping("/{generatedRidesId}/qr-url")
    public ResponseEntity<String> getQrCodeUrl(@PathVariable Integer generatedRidesId) {
        String qrUrl = participantUtil.getQrCodeUrlByRideId(generatedRidesId);
        return ResponseEntity.ok(qrUrl);
    }

    @GetMapping("/{generatedRidesId}/qr-base64")
    public ResponseEntity<String> getQrCodeBase64(@PathVariable Integer generatedRidesId) {
        String qrBase64 = participantUtil.getQrCodeBase64ByRideId(generatedRidesId);
        return ResponseEntity.ok(qrBase64);
    }

    @GetMapping("/{generatedRidesId}/invites")
    public ResponseEntity<String> getInviteUDetailsUrl(@PathVariable Integer generatedRidesId) {
        String inviteDetails = participantUtil.getInviteUrlByRideId(generatedRidesId);
        return ResponseEntity.ok(inviteDetails);
    }


}
