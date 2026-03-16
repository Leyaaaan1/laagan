package leyans.RidersHub.Controller.Api;

import leyans.RidersHub.Service.MapService.MapBox.MapboxService;
import leyans.RidersHub.Service.RidesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/location")
public class MapboxController {
    private final MapboxService mapboxService;

    private final RidesService ridesService;

    @Autowired
    public MapboxController(MapboxService mapboxService, RidesService ridesService) {
        this.mapboxService = mapboxService;
        this.ridesService = ridesService;
    }

    @GetMapping("/staticImage")
    public ResponseEntity<String> getMapImage(@RequestParam double lon, @RequestParam double lat) {



        String imageUrl = mapboxService.getStaticMapImageUrl(lon, lat);
        return ResponseEntity.ok(imageUrl);
    }






}