package leyans.RidersHub.Controller;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
import leyans.RidersHub.ExceptionHandler.UnauthorizedAccessException;
import leyans.RidersHub.Service.RideLocationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;
import java.io.StringWriter;
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

    // =========================================================================
    // 1️⃣ GET ALL PARTICIPANT LOCATIONS
    // =========================================================================
    @GetMapping("/{startedRideId}/locations")
    public ResponseEntity<?> getParticipantsLocations(
            @PathVariable Integer startedRideId) {

        System.out.println("\n📍 [GET /{startedRideId}/locations] Called for Ride: " + startedRideId);

        try {
            List<LocationUpdateRequestDTO> locations =
                    rideLocationService.getLatestParticipantLocations(startedRideId);
            System.out.println("✅ Returning " + locations.size() + " locations\n");
            return ResponseEntity.ok(locations);

        } catch (Exception e) {
            System.err.println("❌ [ERROR] Exception Type: " + e.getClass().getSimpleName());
            System.err.println("❌ [ERROR] Message: " + e.getMessage());

            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            System.err.println("❌ [STACK TRACE]\n" + sw.toString());

            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            error.put("error", "Internal Server Error");
            error.put("message", e.getMessage());
            error.put("exceptionType", e.getClass().getSimpleName());

            if (e.getCause() != null) {
                error.put("cause", e.getCause().getMessage());
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // =========================================================================
    // 2️⃣ GET NEARBY PARTICIPANTS
    // =========================================================================
    @GetMapping("/{startedRideId}/nearby")
    public ResponseEntity<?> getNearbyParticipants(
            @PathVariable Integer startedRideId,
            @RequestParam @DecimalMin("-90.0") @DecimalMax("90.0") double latitude,
            @RequestParam @DecimalMin("-180.0") @DecimalMax("180.0") double longitude,
            @RequestParam(required = false, defaultValue = "5000") double radius) {

        System.out.println("\n📍 [GET /{startedRideId}/nearby] Fetching nearby riders");
        System.out.println("   Ride ID: " + startedRideId);
        System.out.println("   Location: " + latitude + ", " + longitude);
        System.out.println("   Radius: " + radius + " meters");

        try {
            // Validate radius
            if (radius <= 0) {
                System.err.println("❌ [BAD REQUEST] Radius must be greater than 0");
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Radius must be greater than 0 meters"));
            }

            System.out.println("🔍 Calling getNearbyParticipantLocations...");

            // Fetch nearby locations sorted by distance
            List<LocationUpdateRequestDTO> locations =
                    rideLocationService.getNearbyParticipantLocations(
                            startedRideId, latitude, longitude, radius);

            System.out.println("✅ Returning " + locations.size() + " nearby locations\n");
            return ResponseEntity.ok(locations);

        } catch (Exception e) {
            System.err.println("❌ [ERROR] Exception Type: " + e.getClass().getSimpleName());
            System.err.println("❌ [ERROR] Message: " + e.getMessage());

            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            System.err.println("❌ [STACK TRACE]\n" + sw.toString());

            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            error.put("error", "Internal Server Error");
            error.put("message", e.getMessage());
            error.put("exceptionType", e.getClass().getSimpleName());

            if (e.getCause() != null) {
                error.put("cause", e.getCause().getMessage());
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // =========================================================================
    // 3️⃣ SHARE LOCATION & FETCH ALL (WITH PROXIMITY)
    // =========================================================================
    @PostMapping("/{startedRideId}/share")
    public ResponseEntity<?> shareLocationAndGetParticipants(
            @PathVariable Integer startedRideId,
            @RequestParam @DecimalMin("-90.0") @DecimalMax("90.0") double latitude,
            @RequestParam @DecimalMin("-180.0") @DecimalMax("180.0") double longitude) {

        System.out.println("\n🚀 SHARE ENDPOINT HIT - rideId: " + startedRideId);
        System.out.println("📤 [POST /{startedRideId}/share] Sharing location for Ride: " + startedRideId);
        System.out.println("   Location: " + latitude + ", " + longitude);

        try {
            System.out.println("🔍 Calling updateLocationAndFetchAll...");

            // ✅ OPTIMIZED: Single operation combines update + fetch nearby (5km radius)
            List<LocationUpdateRequestDTO> allLocations =
                    rideLocationService.updateLocationAndFetchAll(
                            startedRideId, latitude, longitude);

            System.out.println("✅ Location shared. Returning " + allLocations.size() + " nearby participants\n");
            return ResponseEntity.ok(allLocations);

        } catch (UnauthorizedAccessException.UnauthorizedException e) {
            System.err.println("❌ [FORBIDDEN] " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.FORBIDDEN.value());
            error.put("error", "Unauthorized");
            error.put("message", e.getMessage());
            error.put("exceptionType", e.getClass().getSimpleName());

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);

        } catch (IllegalArgumentException e) {
            System.err.println("❌ [BAD REQUEST] " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.BAD_REQUEST.value());
            error.put("error", "Bad Request");
            error.put("message", e.getMessage());
            error.put("exceptionType", e.getClass().getSimpleName());

            return ResponseEntity.badRequest().body(error);

        } catch (IllegalStateException e) {
            System.err.println("❌ [UNAUTHORIZED] " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.UNAUTHORIZED.value());
            error.put("error", "Unauthorized");
            error.put("message", e.getMessage());
            error.put("exceptionType", e.getClass().getSimpleName());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);

        } catch (Exception e) {
            System.err.println("❌ [ERROR] Exception Type: " + e.getClass().getSimpleName());
            System.err.println("❌ [ERROR] Message: " + e.getMessage());

            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            System.err.println("❌ [STACK TRACE]\n" + sw.toString());

            Map<String, Object> error = new HashMap<>();
            error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            error.put("error", "Internal Server Error");
            error.put("message", e.getMessage());
            error.put("exceptionType", e.getClass().getSimpleName());

            if (e.getCause() != null) {
                error.put("cause", e.getCause().getMessage());
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // =========================================================================
    // 4️⃣ TEST ENDPOINT (DATABASE STATE CHECK)
    // =========================================================================
    @GetMapping("/{startedRideId}/test")
    public ResponseEntity<Map<String, Object>> testDatabaseState(
            @PathVariable Integer startedRideId) {

        System.out.println("\n🧪 [TEST] Database check for started ride: " + startedRideId);

        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("🔍 Calling getLatestParticipantLocations...");

            List<LocationUpdateRequestDTO> locations =
                    rideLocationService.getLatestParticipantLocations(startedRideId);

            response.put("startedRideId", startedRideId);
            response.put("success", true);
            response.put("locationCount", locations.size());
            response.put("locations", locations);
            response.put("message", "Database query successful");

            System.out.println("✅ Test passed: " + locations.size() + " locations found\n");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ [TEST ERROR] Exception Type: " + e.getClass().getSimpleName());
            System.err.println("❌ [TEST ERROR] Message: " + e.getMessage());

            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            System.err.println("❌ [STACK TRACE]\n" + sw.toString());

            response.put("startedRideId", startedRideId);
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("type", e.getClass().getSimpleName());

            if (e.getCause() != null) {
                response.put("cause", e.getCause().getMessage());
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}