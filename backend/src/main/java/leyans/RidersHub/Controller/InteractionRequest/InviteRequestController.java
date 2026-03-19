package leyans.RidersHub.Controller.InteractionRequest;


import com.google.zxing.WriterException;
import leyans.RidersHub.Utility.ParticipantUtil;
import leyans.RidersHub.model.Interaction.InviteRequest;
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
        try {
            String qrUrl = participantUtil.getQrCodeUrlByRideId(generatedRidesId);
            return ResponseEntity.ok(qrUrl);
        } catch (Exception e) {
            System.err.println("Error getting QR URL for ride " + generatedRidesId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

    @GetMapping("/{generatedRidesId}/qr-base64")
    public ResponseEntity<String> getQrCodeBase64(@PathVariable Integer generatedRidesId) {
        try {
            String qrBase64 = participantUtil.getQrCodeBase64ByRideId(generatedRidesId);
            return ResponseEntity.ok(qrBase64);
        } catch (Exception e) {
            System.err.println("Error getting QR base64 for ride " + generatedRidesId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

    @GetMapping("/{generatedRidesId}/invites")
    public ResponseEntity<String> getInviteUDetailsUrl(@PathVariable Integer generatedRidesId) {
        String inviteDetails = participantUtil.getInviteUrlByRideId(generatedRidesId);
        return ResponseEntity.ok(inviteDetails);
    }


}
