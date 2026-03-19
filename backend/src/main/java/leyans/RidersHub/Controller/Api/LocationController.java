package leyans.RidersHub.Controller.Api;

import leyans.RidersHub.Service.LocationService;
import leyans.RidersHub.Service.MapService.NominatimService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/location")
public class LocationController {

    private final NominatimService nominatimService;
    private final LocationService locationService;

    @Autowired
    public LocationController(NominatimService nomService, LocationService locationService) {
        this.nominatimService = nomService;
        this.locationService = locationService;
    }
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchLocation(@RequestParam("query") String query) {
        List<Map<String, Object>> results = nominatimService.searchLocation(query);
        return ResponseEntity.ok(results);
    }
    @GetMapping("/search-landmark")
    public ResponseEntity<List<Map<String, Object>>> searchCityOrLandmark(@RequestParam("query") String query) {
        List<Map<String, Object>> results = nominatimService.searchCityOrLandmark(query);
        return ResponseEntity.ok(results);
    }



    @GetMapping("/reverse")
    public ResponseEntity<String> reverseGeocode(
            @RequestParam("lat") double lat,
            @RequestParam("lon") double lon,
            @RequestParam(value = "fallback", required = false) String fallback) {
        // Use LocationUtilityService instead of NominatimService directly
        String barangayName = locationService.resolveBarangayName(fallback, lat, lon);
        return ResponseEntity.ok(barangayName);
    }

    @GetMapping("/landmark")
    public ResponseEntity<String> getLandmarkOrCity(
            @RequestParam("lat") double lat,
            @RequestParam("lon") double lon) {
        String landmark = locationService.resolveLandMark(null, lat, lon);
        return ResponseEntity.ok(landmark);
    }

}

