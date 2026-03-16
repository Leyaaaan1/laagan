package leyans.RidersHub.Controller.InteractionRequest;

import leyans.RidersHub.Config.Security.SecurityUtils;
import leyans.RidersHub.Service.InteractionRequest.RideParticipantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/participants")
public class ParticipantsController {


    private final RideParticipantService rideParticipantService;

    public ParticipantsController(RideParticipantService rideParticipantService) {
        this.rideParticipantService = rideParticipantService;
    }

    @PostMapping("/{rideId}/add/{username}")
    public ResponseEntity<?> addParticipant(@PathVariable("rideId") Integer generatedRidesId,
                                            @PathVariable("username") String username) {
        try {
            ResponseEntity<?> authResponse = SecurityUtils.validateAuthentication();
            if (authResponse != null) {
                return authResponse;
            }

            rideParticipantService.addParticipantToRide(generatedRidesId, username);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Participant " + username + " added to ride " + generatedRidesId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding participant: " + e.getMessage());
        }
    }

    @DeleteMapping("/{rideId}/remove/{username}")
    public ResponseEntity<?> removeParticipant(@PathVariable("rideId") Integer generatedRidesId,
                                               @PathVariable("username") String username) {
        try {
            ResponseEntity<?> authResponse = SecurityUtils.validateAuthentication();
            if (authResponse != null) {
                return authResponse;
            }

            rideParticipantService.removeParticipantFromRide(generatedRidesId, username);
            return ResponseEntity.ok()
                    .body("Participant " + username + " removed from ride " + generatedRidesId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error removing participant: " + e.getMessage());
        }
    }






    @GetMapping("/test/auth")
    public ResponseEntity<String> testAuth() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok("Authenticated as: " + username);
    }
}
