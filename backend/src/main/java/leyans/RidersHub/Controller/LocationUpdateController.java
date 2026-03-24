package leyans.RidersHub.Controller;


import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
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
    @GetMapping("/all-riders")
    public ResponseEntity<List<LocationUpdateRequestDTO>> getAllRiderLocations() {
        System.out.println("\n📍 [GET /all-riders] Fetching all rider locations");
        try {
            List<LocationUpdateRequestDTO> locations = rideLocationService.getAllRiderLocations();
            System.out.println("✅ Returning " + locations.size() + " locations\n");
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            System.err.println("❌ [ERROR] " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{generatedRidesId}/share")
    public ResponseEntity<List<LocationUpdateRequestDTO>> shareLocationAndGetParticipants(
            @PathVariable Integer generatedRidesId,
            @RequestParam double latitude,
            @RequestParam double longitude) {

        System.out.println("\n🚀 [POST /share] Called for Ride: " + generatedRidesId);
        System.out.println("   Location: Lat=" + latitude + " | Lng=" + longitude);

        try {
            // Step 1: Save current rider's location
            System.out.println("📍 [STEP 1] Saving rider location...");
            LocationUpdateRequestDTO saved = rideLocationService.updateLocation(generatedRidesId, latitude, longitude);
            System.out.println("✅ [STEP 1] Saved location for rider: " + saved.getInitiator());

            // Step 2: Fetch all participants' latest locations
            System.out.println("🔄 [STEP 2] Fetching all participant locations...");
            List<LocationUpdateRequestDTO> allLocations = rideLocationService.getLatestParticipantLocations(generatedRidesId);
            System.out.println("✅ [STEP 2] Retrieved " + allLocations.size() + " locations");

            allLocations.forEach(loc -> {
                System.out.println("   - " + loc.getInitiator() + ": " + loc.getLatitude() + ", " + loc.getLongitude());
            });

            System.out.println("📤 Returning " + allLocations.size() + " locations to client\n");
            return ResponseEntity.ok(allLocations);

        } catch (IllegalArgumentException e) {
            System.err.println("❌ [ERROR] IllegalArgumentException: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("❌ [ERROR] Unexpected exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

//    @PostMapping("/{generatedRidesId}/update")
//    public LocationUpdateRequestDTO updateLocation (@PathVariable Integer generatedRidesId,
//            @PathVariable LocationResponseDTO responseDTO) {
//
//        return rideLocationService.updateLocation(
//                generatedRidesId,
//                responseDTO.getLatitude(),  responseDTO.getLongitude()
//        );
//    }


    @GetMapping("/{generatedRidesId}/locations")
    public ResponseEntity<List<LocationUpdateRequestDTO>> getParticipantsLocations(
            @PathVariable Integer generatedRidesId) {

        System.out.println("\n📍 [GET /locations] Called for Ride: " + generatedRidesId);

        try {
            List<LocationUpdateRequestDTO> locations = rideLocationService.getLatestParticipantLocations(generatedRidesId);
            System.out.println("✅ Returning " + locations.size() + " locations\n");
            return ResponseEntity.ok(locations);

        } catch (Exception e) {
            System.err.println("❌ [ERROR] " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    //for debug
    @GetMapping("/{generatedRidesId}/test")
    public ResponseEntity<Map<String, Object>> testDatabaseState(@PathVariable Integer generatedRidesId) {
        System.out.println("\n🧪 [TEST] Database check for ride: " + generatedRidesId);

        Map<String, Object> response = new HashMap<>();

        try {
            List<LocationUpdateRequestDTO> locations = rideLocationService.getLatestParticipantLocations(generatedRidesId);
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
