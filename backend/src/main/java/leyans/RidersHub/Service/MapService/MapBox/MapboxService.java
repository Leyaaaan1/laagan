
package leyans.RidersHub.Service.MapService.MapBox;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MapboxService {

    @Value("${mapbox.token}")
    private String mapboxToken;

    @Value("${mapbox.static-map-url}")
    private String mapboxUrlTemplate;

    private final UploadImageService uploadImageService;

    @Autowired
    public MapboxService(UploadImageService uploadImageService) {
        this.uploadImageService = uploadImageService;
    }

    public String getStaticMapImageUrl(double lon, double lat) {
        // Format: pin-s+ff0000(pinLon,pinLat)/centerLon,centerLat,zoom,bearing/width x height
        String mapboxUrl = String.format(
                mapboxUrlTemplate,
                lon,        // pin longitude
                lat,        // pin latitude
                lon,        // center longitude (same as pin)
                lat,        // center latitude (same as pin)
                mapboxToken // access token
        );

        return uploadImageService.uploadMapImage(mapboxUrl);
    }
}