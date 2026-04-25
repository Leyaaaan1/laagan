package leyans.RidersHub.Controller;


import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
import leyans.RidersHub.ExceptionHandler.UnauthorizedAccessException;
import leyans.RidersHub.Service.RideLocationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/location")
public class LocationUpdateController {

    final private RideLocationService rideLocationService;

    public LocationUpdateController(RideLocationService rideLocationService) {
        this.rideLocationService = rideLocationService;
    }

    @GetMapping("/{startedRideId}/all-riders")  // ← Update path variable name
    public ResponseEntity<List<LocationUpdateRequestDTO>> getAllRiderLocations(
            @PathVariable Integer startedRideId) {  // ← Changed to Integer

        System.out.println("\n📍 [GET /{startedRideId}/all-riders] Fetching all rider locations for Ride: " + startedRideId);
        try {
            List<LocationUpdateRequestDTO> locations = rideLocationService.getAllRiderLocations(startedRideId);
            System.out.println("✅ Returning " + locations.size() + " locations\n");
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            System.err.println("❌ [ERROR] " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{startedRideId}/locations")  // ← Update path variable name
    public ResponseEntity<List<LocationUpdateRequestDTO>> getParticipantsLocations(
            @PathVariable Integer startedRideId) {  // ← Changed to Integer

        System.out.println("\n📍 [GET /locations] Called for Ride: " + startedRideId);

        try {
            List<LocationUpdateRequestDTO> locations =
                    rideLocationService.getLatestParticipantLocations(startedRideId);
            System.out.println("✅ Returning " + locations.size() + " locations\n");
            return ResponseEntity.ok(locations);

        } catch (Exception e) {
            System.err.println("❌ [ERROR] " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }



    @PostMapping("/{startedRideId}/share")
    public ResponseEntity<?> shareLocationAndGetParticipants(
            @PathVariable Integer startedRideId,
            @RequestParam double latitude,
            @RequestParam double longitude) {

        try {
            // ✅ OPTIMIZED: Single operation combines update + fetch
            List<LocationUpdateRequestDTO> allLocations =
                    rideLocationService.updateLocationAndFetchAll(
                            startedRideId, latitude, longitude);
            return ResponseEntity.ok(allLocations);

        } catch (UnauthorizedAccessException.UnauthorizedException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.FORBIDDEN.value());
            error.put("error", "Unauthorized");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);

        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.BAD_REQUEST.value());
            error.put("error", "Bad Request");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);

        } catch (IllegalStateException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.UNAUTHORIZED.value());
            error.put("error", "Unauthorized");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            error.put("error", "Internal Server Error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }


    @GetMapping("/{startedRideId}/test")
    public ResponseEntity<Map<String, Object>> testDatabaseState(
            @PathVariable Integer startedRideId) {

        System.out.println("\n🧪 [TEST] Database check for started ride: " + startedRideId);

        Map<String, Object> response = new HashMap<>();

        try {
            List<LocationUpdateRequestDTO> locations =
                    rideLocationService.getLatestParticipantLocations(startedRideId);
            response.put("startedRideId", startedRideId);
            response.put("success", true);
            response.put("locationCount", locations.size());
            response.put("locations", locations);
            response.put("message", "Database query successful");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("startedRideId", startedRideId);
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("type", e.getClass().getSimpleName());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

}