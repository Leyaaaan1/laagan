package leyans.RidersHub.Service.MapService.MapBox;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MapboxService {
    private final String mapboxToken;
    private final UploadImageService uploadImageService;

    @Value("${mapbox.static-map.url-template}")
    private String mapboxUrlTemplate;

    @Autowired
    public MapboxService(@Value("${MAPBOX_TOKEN}") String mapboxToken,
                         UploadImageService uploadImageService) {
        this.mapboxToken = mapboxToken;
        this.uploadImageService = uploadImageService;
    }
    public String getStaticMapImageUrl(double lon, double lat) {
        String mapboxUrl = String.format(mapboxUrlTemplate,
                lon, lat, lon, lat, mapboxToken);

        return uploadImageService.uploadMapImage(mapboxUrl);
    }





}