package leyans.RidersHub.Controller.Api;

import leyans.RidersHub.DTO.Request.LocationDTO.LocationImageDto;
import leyans.RidersHub.Service.MapService.WikimediaImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/wikimedia")
public class WikimediaImageController {

    @Autowired
    private WikimediaImageService wikimediaImageService;

    @GetMapping("/location")
    public ResponseEntity<List<LocationImageDto>> getLocationImages(@RequestParam String locationName) {

        List<LocationImageDto> imageDtos = wikimediaImageService.getLocationImage(locationName);

        if (imageDtos == null || imageDtos.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(imageDtos);
    }
}