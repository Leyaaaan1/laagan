package leyans.RidersHub.Controller.Api;

import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import leyans.RidersHub.Service.MapService.MapBox.MapboxService;
import leyans.RidersHub.Service.RidesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/location")
public class MapboxController {
    private final MapboxService mapboxService;


    public MapboxController(MapboxService mapboxService) {
        this.mapboxService = mapboxService;
    }

    @GetMapping("/staticImage")
    @RateLimiter(name = "mapbox")
    public ResponseEntity<String> getMapImage(@RequestParam double lon, @RequestParam double lat) {
        String imageUrl = mapboxService.getStaticMapImageUrl(lon, lat);
        return ResponseEntity.ok(imageUrl);
    }






}