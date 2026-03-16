package leyans.RidersHub.Controller;

import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
import leyans.RidersHub.Service.RideLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/update")
public class RiderLocationController {

    @Autowired
    private RideLocationService rideLocationService;


    @PostMapping("/{generatedRidesId}")
    public ResponseEntity<?> updateParticipantLocation(
            @PathVariable Integer generatedRidesId,
            @RequestBody Map<String, Double> coordinates) {

        try {
            double latitude = coordinates.get("latitude");
            double longitude = coordinates.get("longitude");

            LocationUpdateRequestDTO response =
                    rideLocationService.updateLocation(generatedRidesId, latitude, longitude);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error updating location: " + e.getMessage());
        }
    }


}





