package leyans.RidersHub.Controller.Api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import leyans.RidersHub.Service.MapService.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import leyans.RidersHub.DTO.Request.RidesDTO.RouteRequestDTO;

@RestController
@RequestMapping("/routes")
public class RouteController {

    @Autowired
    private RouteService routeService; // Use your existing service

    /**
     * Get route directions between points using existing DirectionsService
     * Returns simplified coordinate array for frontend
     */
    @PostMapping("/preview")
    public ResponseEntity<JsonNode> getRoutePreview(@RequestBody RouteRequestDTO routeRequest) {
        try {
            System.out.println("=== ROUTE PREVIEW REQUEST ===");
            System.out.println("Start: " + routeRequest.getStartLat() + ", " + routeRequest.getStartLng());
            System.out.println("End: " + routeRequest.getEndLat() + ", " + routeRequest.getEndLng());
            System.out.println("Stop points: " + (routeRequest.getStopPoints() != null ? routeRequest.getStopPoints().size() : 0));

            // Validate coordinates
            if (routeRequest.getStartLat() == 0 || routeRequest.getStartLng() == 0 ||
                    routeRequest.getEndLat() == 0 || routeRequest.getEndLng() == 0) {
                return ResponseEntity.badRequest().body(null);
            }

            // Get the full GeoJSON from ORS API
            String routeGeoJSON = routeService.getRouteDirections(
                    routeRequest.getStartLng(),
                    routeRequest.getStartLat(),
                    routeRequest.getEndLng(),
                    routeRequest.getEndLat(),
                    routeRequest.getStopPoints(),
                    "driving-car"
            );

            if (routeGeoJSON != null && !routeGeoJSON.trim().isEmpty()) {
                // Return the full GeoJSON instead of extracted coordinates
                ObjectMapper mapper = new ObjectMapper();
                JsonNode geoJsonNode = mapper.readTree(routeGeoJSON);
                System.out.println("Returning full GeoJSON route data");
                return ResponseEntity.ok(geoJsonNode);
            } else {
                System.out.println("No route data received from DirectionsService");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
        } catch (Exception e) {
            System.err.println("Error in getRoutePreview: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }    @GetMapping("/coordinate/{generatedRidesId}")
    public ResponseEntity<JsonNode> getRideRoute(@PathVariable Integer generatedRidesId) {
        JsonNode geoJson = routeService.getSavedRouteGeoJson(generatedRidesId);
        return ResponseEntity.ok(geoJson);
    }


}