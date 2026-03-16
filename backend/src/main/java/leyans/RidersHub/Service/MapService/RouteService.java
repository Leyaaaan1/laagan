package leyans.RidersHub.Service.MapService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import leyans.RidersHub.Repository.RidesRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpClientErrorException;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RouteService {

    @Value("${ORS_API_KEY}")
    private String orsApiKey;
    @Value("${openrouteservice.api.url:https://api.openrouteservice.org}")
    private String orsBaseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private final RidesRepository ridesRepository;

    public RouteService(RidesRepository ridesRepository) {
        this.ridesRepository = ridesRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Get full route directions with all details from ORS API
     */
    public String getRouteDirections(double startLng, double startLat,
                                     double endLng, double endLat,
                                     List<StopPointDTO> stopPoints,
                                     String profile) {
        try {
            String url = orsBaseUrl + "/v2/directions/" + profile + "/geojson";

            // Build coordinates array: [start, stops..., end]
            List<double[]> coordinates = new ArrayList<>();
            coordinates.add(new double[]{startLng, startLat});

            // Add stop points if any
            if (stopPoints != null && !stopPoints.isEmpty()) {
                for (StopPointDTO stop : stopPoints) {
                    if (stop.getStopLongitude() != 0.0 && stop.getStopLatitude() != 0.0) {
                        coordinates.add(new double[]{stop.getStopLongitude(), stop.getStopLatitude()});
                    }
                }
            }

            coordinates.add(new double[]{endLng, endLat});

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("coordinates", coordinates);
            requestBody.put("format", "geojson");
            requestBody.put("geometry_simplify", false);
            requestBody.put("continue_straight", false);

            // Add additional options for better routing
            Map<String, Object> options = new HashMap<>();
            options.put("avoid_features", new String[]{"ferries"});
            requestBody.put("options", options);

            // Set header
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", orsApiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Make API call
            String response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class).getBody();

            return response;
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("ORS API Error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get route directions: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public JsonNode getSavedRouteGeoJson(Integer generatedRidesId) {
        try {
            // Get the stored route GeoJSON as String
            String routeGeoJson = ridesRepository.findRouteCoordinatesByGeneratedRidesId(generatedRidesId);

            if (routeGeoJson == null || routeGeoJson.trim().isEmpty()) {
                return objectMapper.createObjectNode(); // return empty JSON
            }

            // Parse into JsonNode so it's valid JSON when returned
            return objectMapper.readTree(routeGeoJson);

        } catch (Exception e) {
            System.out.println("Error getting saved route GeoJSON: " + e.getMessage());
            e.printStackTrace();
            return objectMapper.createObjectNode(); // return empty JSON on error
        }
    }


}