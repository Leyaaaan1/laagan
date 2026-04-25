package leyans.RidersHub.Service.MapService.MapBox;

import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

/**
 * ✅ OPTIMIZED Mapbox Service
 *
 * Features:
 * - Rate limiting: 1 request/minute (Mapbox free tier)
 * - Caching: 1-hour TTL to avoid duplicate map requests
 * - Error handling: Graceful fallback on failure
 * - Logging: Track API usage for cost monitoring
 */
@Component
public class MapboxService {

    private final String mapboxToken;
    private final UploadImageService uploadImageService;

    @Value("${mapbox.static-map-url}")
    private String mapboxUrlTemplate;

    private int mapGenerationCount = 0;

    @Autowired
    public MapboxService(@Value("${mapbox.token}") String mapboxToken,
                         UploadImageService uploadImageService) {
        this.mapboxToken = mapboxToken;
        this.uploadImageService = uploadImageService;
    }

    @Cacheable(
            value = "mapbox-images",
            key = "'map_' + T(java.lang.Math).round(#lon * 1000) + '_' + T(java.lang.Math).round(#lat * 1000)",
            unless = "#result == null"
    )
    @RateLimiter(
            name = "mapbox",
            fallbackMethod = "mapboxFallback"
    )
    public String getStaticMapImageUrl(double lon, double lat) {

        try {
            // ✅ NEW: Validate coordinates before requesting
            if (!isValidCoordinates(lon, lat)) {
                System.err.println("❌ Invalid coordinates: " + lon + ", " + lat);
                return null;
            }

            // Build the Mapbox URL
            String mapboxUrl = String.format(mapboxUrlTemplate,
                    lon, lat, lon, lat, mapboxToken);




            // Upload to Cloudinary and get CDN URL
            String cloudinaryUrl = uploadImageService.uploadMapImage(mapboxUrl);

            if (cloudinaryUrl != null) {
                mapGenerationCount++;
                System.out.println("✅ [MAPBOX] Map generated and cached. Total: " + mapGenerationCount);
            }

            return cloudinaryUrl;

        } catch (Exception e) {
            System.err.println("❌ [MAPBOX] Error generating map: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    public String mapboxFallback(double lon, double lat, Exception e) {
        System.err.println("⚠️  [MAPBOX] Rate limit exceeded: " + e.getMessage());
        System.err.println("   Coordinates: " + lon + ", " + lat);
        System.err.println("   💡 Tip: Using cached data or returning null. Try again in 1 minute.");

        return null;
    }

    private boolean isValidCoordinates(double lon, double lat) {
        // Mindanao bounding box: 119.0°E to 127.0°E, 5.4°N to 10.5°N
        return lon >= 119.0 && lon <= 127.0 && lat >= 5.4 && lat <= 10.5;
    }


}