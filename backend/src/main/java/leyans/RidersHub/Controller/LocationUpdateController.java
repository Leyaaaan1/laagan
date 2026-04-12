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

    // -------------------------------------------------------------------------
    // GET /location/{generatedRidesId}/all-riders
    //
    // FIX: The old signature had no @PathVariable, so it called the service
    //      with no rideId — it would not compile against the updated service.
    //      Added @PathVariable Integer generatedRidesId to match the service.
    // -------------------------------------------------------------------------
    @GetMapping("/{generatedRidesId}/all-riders")
    public ResponseEntity<List<LocationUpdateRequestDTO>> getAllRiderLocations(
            @PathVariable String generatedRidesId) {

        System.out.println("\n📍 [GET /{generatedRidesId}/all-riders] Fetching all rider locations for Ride: " + generatedRidesId);
        try {
            List<LocationUpdateRequestDTO> locations = rideLocationService.getAllRiderLocations(generatedRidesId);
            System.out.println("✅ Returning " + locations.size() + " locations\n");
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            System.err.println("❌ [ERROR] " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // -------------------------------------------------------------------------
    // POST /location/{generatedRidesId}/share?latitude=x&longitude=y
    //
    // FIX: .badRequest().build() returned an empty body — the caller had no
    //      idea what went wrong.  Now returns the error message in the body.
    // -------------------------------------------------------------------------
    @PostMapping("/{generatedRidesId}/share")
    public ResponseEntity<?> shareLocationAndGetParticipants(
            @PathVariable String generatedRidesId,
            @RequestParam
            @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
            @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
            double latitude,
            @RequestParam
            @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
            @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
            double longitude) {

        try {
            rideLocationService.updateLocation(generatedRidesId, latitude, longitude);

            List<LocationUpdateRequestDTO> allLocations =
                    rideLocationService.getLatestParticipantLocations(generatedRidesId);

            return ResponseEntity.ok(allLocations);

        } catch (UnauthorizedAccessException.UnauthorizedException e) {
            // ✅ FIXED: Return 403 for authorization failures
            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.FORBIDDEN.value());
            error.put("error", "Unauthorized");
            error.put("message", "You are not authorized to update location for this ride");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);

        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.BAD_REQUEST.value());
            error.put("error", "Bad Request");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);

        } catch (Exception e) {
            // ✅ FIXED: Never expose internal error messages
            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            error.put("error", "Internal Server Error");
            error.put("message", "Failed to update location");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }    // -------------------------------------------------------------------------
    // GET /location/{generatedRidesId}/locations
    // No changes needed — already calls the correct service method.
    // -------------------------------------------------------------------------
    @GetMapping("/{generatedRidesId}/locations")
    public ResponseEntity<List<LocationUpdateRequestDTO>> getParticipantsLocations(
            @PathVariable String generatedRidesId) {

        System.out.println("\n📍 [GET /locations] Called for Ride: " + generatedRidesId);

        try {
            List<LocationUpdateRequestDTO> locations =
                    rideLocationService.getLatestParticipantLocations(generatedRidesId);
            System.out.println("✅ Returning " + locations.size() + " locations\n");
            return ResponseEntity.ok(locations);

        } catch (Exception e) {
            System.err.println("❌ [ERROR] " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // -------------------------------------------------------------------------
    // GET /location/{generatedRidesId}/test  — debug endpoint, no changes needed
    // -------------------------------------------------------------------------
    @GetMapping("/{generatedRidesId}/test")
    public ResponseEntity<Map<String, Object>> testDatabaseState(
            @PathVariable String generatedRidesId) {

        System.out.println("\n🧪 [TEST] Database check for ride: " + generatedRidesId);

        Map<String, Object> response = new HashMap<>();

        try {
            List<LocationUpdateRequestDTO> locations =
                    rideLocationService.getLatestParticipantLocations(generatedRidesId);
            response.put("rideId", generatedRidesId);
            response.put("success", true);
            response.put("locationCount", locations.size());
            response.put("locations", locations);
            response.put("message", "Database query successful");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("rideId", generatedRidesId);
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("type", e.getClass().getSimpleName());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}