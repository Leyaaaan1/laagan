package leyans.RidersHub.Controller;

import leyans.RidersHub.DTO.Response.RideResponseDTO;
import leyans.RidersHub.DTO.Response.StartRideResponseDTO;
import leyans.RidersHub.Service.StartRideService;
import leyans.RidersHub.Utility.StartedUtil;
import leyans.RidersHub.model.StartedRide;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/start")
public class StartRideController {

    private final StartRideService startRideService;
    private final StartedUtil startedUtil;

    public StartRideController(StartRideService startRideService, StartedUtil startedUtil) {
        this.startRideService = startRideService;
        this.startedUtil = startedUtil;
    }

    @PostMapping("/{generatedRidesId}")
    public ResponseEntity<StartRideResponseDTO> startRide(@PathVariable Integer generatedRidesId) {
        try {
            StartRideResponseDTO response = startRideService.startRide(generatedRidesId);

            return ResponseEntity.ok(response);
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/active")
    public ResponseEntity<RideResponseDTO> getActiveRide() {
        try {
            RideResponseDTO rideDetails = startedUtil.getStartedRideDetails();
            return ResponseEntity.ok(rideDetails);
        } catch (IllegalArgumentException ex) {
            // No active ride found for user
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalStateException ex) {
            // Ride is in conflicting state
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception ex) {
            // Internal server error
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @PostMapping("/update/{generatedRidesId}")
    public ResponseEntity<Void> updateRide(@PathVariable Integer generatedRidesId) {
        try {
            startRideService.deactivateRide(generatedRidesId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


}



