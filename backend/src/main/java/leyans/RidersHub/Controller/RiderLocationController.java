package leyans.RidersHub.Controller;

import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
import leyans.RidersHub.Service.RideLocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/update")
public class RiderLocationController {
    private final RideLocationService rideLocationService;

    public RiderLocationController(RideLocationService rideLocationService) {
        this.rideLocationService = rideLocationService;
    }

    // -------------------------------------------------------------------------
    // POST /update/{generatedRidesId}
    // Body: { "latitude": 7.1234, "longitude": 125.5678 }
    //
    // No logic changes needed — updateLocation() in the service now upserts,
    // so this endpoint automatically stops creating duplicate rows.
    // -------------------------------------------------------------------------
    @PostMapping("/{generatedRidesId}")
    public ResponseEntity<?> updateParticipantLocation(
            @PathVariable String generatedRidesId,
            @RequestBody Map<String, Double> coordinates) {

        try {
            double latitude  = coordinates.get("latitude");
            double longitude = coordinates.get("longitude");

            LocationUpdateRequestDTO response =
                    rideLocationService.updateLocation(generatedRidesId, latitude, longitude);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error updating location: " + e.getMessage());
        }
    }
}