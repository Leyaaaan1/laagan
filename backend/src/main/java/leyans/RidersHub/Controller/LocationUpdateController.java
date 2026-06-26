package leyans.RidersHub.Controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
import leyans.RidersHub.DTO.Response.LocationShareResponseDTO;
import leyans.RidersHub.ExceptionHandler.UnauthorizedAccessException;
import leyans.RidersHub.Service.RideLocationEmitterRegistry;
import leyans.RidersHub.Service.RideLocationService;
import leyans.RidersHub.Utility.AppLogger;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/location")
public class LocationUpdateController {

    final private RideLocationService rideLocationService;
    private final RideLocationEmitterRegistry emitterRegistry;

    public LocationUpdateController(RideLocationService rideLocationService,
            RideLocationEmitterRegistry emitterRegistry) {
        this.rideLocationService = rideLocationService;
        this.emitterRegistry = emitterRegistry;
    }

    @GetMapping("/{startedRideId}/all-riders") // ← Update path variable name
    public ResponseEntity<List<LocationUpdateRequestDTO>> getAllRiderLocations(
            @PathVariable Integer startedRideId) { // ← Changed to Integer

        System.out.println(
                "\n [GET /{startedRideId}/all-riders] Fetching all rider locations for Ride: " + startedRideId);
        try {
            List<LocationUpdateRequestDTO> locations = rideLocationService.getAllRiderLocations(startedRideId);
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping(value = "/{startedRideId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamLocations(
            @PathVariable Integer startedRideId,
            HttpServletResponse response) {

        rideLocationService.validateRideAccess(startedRideId);

        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control", "no-cache");
        AppLogger.info(this.getClass(), "New SSE connection for ride: " + startedRideId);

        return emitterRegistry.subscribe(startedRideId);
    }

    @GetMapping("/{startedRideId}/locations") // ← Update path variable name
    public ResponseEntity<List<LocationUpdateRequestDTO>> getParticipantsLocations(
            @PathVariable Integer startedRideId) { // ← Changed to Integer
        AppLogger.info(this.getClass(), "GET /{startedRideId}/locations called");
        try {
            List<LocationUpdateRequestDTO> locations = rideLocationService.getLatestParticipantLocations(startedRideId);
            AppLogger.info(this.getClass(), "Fetched participant locations");
            return ResponseEntity.ok(locations);

        } catch (Exception e) {
            e.printStackTrace();
            AppLogger.error(this.getClass(), "Error fetching participant locations");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{startedRideId}/share")
    public ResponseEntity<?> shareLocationAndGetParticipants(
            @PathVariable Integer startedRideId,
            @RequestParam double latitude,
            @RequestParam double longitude) {

        try {
            LocationShareResponseDTO response = // ← changed
                    rideLocationService.updateLocationAndFetchAll(
                            startedRideId, latitude, longitude);
            return ResponseEntity.ok(response); // ← changed

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

}