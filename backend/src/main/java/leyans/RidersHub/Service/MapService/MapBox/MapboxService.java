
package leyans.RidersHub.Service.MapService.MapBox;

import leyans.RidersHub.model.Rides;
import org.locationtech.jts.geom.Point;
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

    public String getStaticMapImageUrlWithRoute(Rides ride) {
        try {
            Point start = ride.getStartingLocation();
            Point end = ride.getEndingLocation();

            // Build URL with start pin (green) and end pin (red)
            // Format: pin-s+00FF00(startLon,startLat)/pin-s+FF0000(endLon,endLat)/centerLon,centerLat,zoom/widthxheight
            String mapboxUrl = String.format(
                    mapboxUrlTemplate + "&overlay=pin-s+00FF00(%f,%f)&overlay=pin-s+FF0000(%f,%f)",
                    start.getX(), start.getY(),  // start pin
                    end.getX(), end.getY(),      // end pin
                    (start.getX() + end.getX()) / 2,  // center longitude
                    (start.getY() + end.getY()) / 2,  // center latitude
                    mapboxToken
            );

            return uploadImageService.uploadMapImage(mapboxUrl);
        } catch (Exception e) {
            return null;
        }

    }
}