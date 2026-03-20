package leyans.RidersHub.Service.MapService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.Repository.RidesRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
public class RouteService {

    @Value("${GRASS_HOPPER}")
    private String grassApiKey;

    private static final String GH_BASE_URL = "https://graphhopper.com/api/1/route";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final RidesRepository ridesRepository;

    public RouteService(RidesRepository ridesRepository,
                        RestTemplate restTemplate,
                        ObjectMapper objectMapper) {
        this.ridesRepository = ridesRepository;
        this.restTemplate    = restTemplate;
        this.objectMapper    = objectMapper;
    }

    /**
     * Get route directions from GraphHopper and return as GeoJSON
     * so the rest of your app (RouteController, frontend) stays unchanged.
     */
    public String getRouteDirections(double startLng, double startLat,
                                     double endLng,   double endLat,
                                     List<StopPointDTO> stopPoints,
                                     String profile) {
        try {
            // ── Build point list: start → stops → end ─────────────────────
            List<String> points = new ArrayList<>();
            points.add(startLat + "," + startLng);

            if (stopPoints != null) {
                for (StopPointDTO stop : stopPoints) {
                    if (stop.getStopLatitude() != 0.0 && stop.getStopLongitude() != 0.0) {
                        points.add(stop.getStopLatitude() + "," + stop.getStopLongitude());
                    }
                }
            }

            points.add(endLat + "," + endLng);

            // ── Build query string ─────────────────────────────────────────
            // GraphHopper uses repeated "point=" params, one per waypoint
            StringBuilder url = new StringBuilder(GH_BASE_URL + "?");
            for (String point : points) {
                url.append("point=").append(point).append("&");
            }
            url.append("vehicle=").append(mapProfile(profile));
            url.append("&type=json");           // response format
            url.append("&points_encoded=false"); // return readable lat/lng arrays
            url.append("&key=").append(grassApiKey);

            // ── Call GraphHopper ───────────────────────────────────────────
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "RidersHub/1.0 (paninsorolean@gmail.com)");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url.toString(), HttpMethod.GET, entity, String.class
            );

            // ── Convert GraphHopper JSON → GeoJSON so frontend unchanged ──
            return convertToGeoJson(response.getBody());

        } catch (HttpClientErrorException e) {
            throw new RuntimeException("GraphHopper API Error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get route directions: " + e.getMessage(), e);
        }
    }

    /**
     * Map ORS profile names to GraphHopper vehicle types.
     * Add more mappings here if you add more ride types.
     */
    private String mapProfile(String orsProfile) {
        if (orsProfile == null) return "car";
        return switch (orsProfile) {
            case "driving-car"        -> "car";
            case "driving-hgv"        -> "car";
            case "cycling-regular"    -> "bike";
            case "cycling-mountain"   -> "mtb";
            case "foot-walking"       -> "foot";
            case "driving-motorcycle" -> "motorcycle";
            default                   -> "car";
        };
    }

    /**
     * Convert GraphHopper JSON response to GeoJSON FeatureCollection.
     * Your RouteController and frontend already expect GeoJSON — this
     * keeps them completely unchanged.
     *
     * GraphHopper shape points are [lng, lat] arrays when points_encoded=false.
     */
    private String convertToGeoJson(String graphHopperJson) throws Exception {
        JsonNode root = objectMapper.readTree(graphHopperJson);
        JsonNode path = root.path("paths").get(0);

        if (path == null || path.isMissingNode()) {
            throw new RuntimeException("No route path returned from GraphHopper");
        }

        // Extract coordinate array from points.coordinates
        JsonNode coords = path.path("points").path("coordinates");

        // Build GeoJSON FeatureCollection matching what ORS returned
        String geoJson = """
                {
                  "type": "FeatureCollection",
                  "features": [{
                    "type": "Feature",
                    "geometry": {
                      "type": "LineString",
                      "coordinates": %s
                    },
                    "properties": {
                      "distance": %s,
                      "duration": %s
                    }
                  }]
                }
                """.formatted(
                objectMapper.writeValueAsString(coords),
                path.path("distance").asText("0"),
                path.path("time").asText("0")
        );

        return geoJson;
    }

    // ── Saved route (unchanged) ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public JsonNode getSavedRouteGeoJson(Integer generatedRidesId) {
        try {
            String routeGeoJson = ridesRepository.findRouteCoordinatesByGeneratedRidesId(generatedRidesId);
            if (routeGeoJson == null || routeGeoJson.trim().isEmpty()) {
                return objectMapper.createObjectNode();
            }
            return objectMapper.readTree(routeGeoJson);
        } catch (Exception e) {
            System.out.println("Error getting saved route GeoJSON: " + e.getMessage());
            return objectMapper.createObjectNode();
        }
    }
}