package leyans.RidersHub.Service.MapService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Service.MapService.utilities.ApiHelper;
import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.io.HttpClientConnectionManager;
import org.apache.hc.core5.util.Timeout;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class RouteService {

    private static final String GH_BASE_URL = "https://graphhopper.com/api/1/route";

    // Mindanao bounding box used for future geo-validation if needed
    private static final double MIN_LAT = 5.4,  MAX_LAT = 10.5;
    private static final double MIN_LON = 119.0, MAX_LON = 127.0;

    @Value("${GRASS_HOPPER}")
    private String grassApiKey;

    @Value("${USER_AGENT}")
    private static String userAgent;

    private final ApiHelper apiHelper;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final RidesRepository ridesRepository;

    /**
     * Pool settings tuned for a single-node ride-sharing backend:
     *   maxTotal=20   — no more than 20 concurrent GraphHopper connections
     *   defaultMaxPerRoute=10 — up to 10 to the same host (graphhopper.com)
     *   connectTimeout=3s, responseTimeout=10s
     */
    public RouteService(ApiHelper apiHelper, RidesRepository ridesRepository,
                        ObjectMapper objectMapper) {
        this.apiHelper = apiHelper;
        this.ridesRepository = ridesRepository;
        this.objectMapper    = objectMapper;
        this.restTemplate    = buildPooledRestTemplate();
    }


    @RateLimiter(name = "graphhopper", fallbackMethod = "routeFallback")
    public String getRouteDirections(double startLng, double startLat,
                                     double endLng,   double endLat,
                                     List<StopPointDTO> stopPoints,
                                     String profile) {
        try {
            List<String> points = apiHelper.buildPointList(startLat, startLng, stopPoints, endLat, endLng);

            // UriComponentsBuilder doesn't support repeated same-key params natively,
            // so we append them manually then hand off to the builder for encoding.
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(GH_BASE_URL);
            points.forEach(p -> builder.queryParam("point", p));

            builder.queryParam("vehicle",        apiHelper.mapProfile(profile))
                    .queryParam("type",            "json")
                    .queryParam("points_encoded",  "false")
                    .queryParam("simplify",        "true")   // ← reduce coordinate count
                    .queryParam("instructions",    "true")
                    .queryParam("locale",          "en")
                    .queryParam("key",             grassApiKey);

            String url = builder.build(false).toUriString();
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", userAgent);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);

            return apiHelper.convertToGeoJson(response.getBody());

        } catch (HttpClientErrorException e) {
            throw new RuntimeException("GraphHopper API error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get route directions: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public JsonNode getSavedRouteGeoJson(Integer generatedRidesId) {
        try {
            String routeGeoJson =
                    ridesRepository.findRouteCoordinatesByGeneratedRidesId(generatedRidesId);
            if (routeGeoJson == null || routeGeoJson.isBlank()) {
                return objectMapper.createObjectNode();
            }
            return objectMapper.readTree(routeGeoJson);
        } catch (Exception e) {
            System.err.println("Error reading saved route GeoJSON: " + e.getMessage());
            return objectMapper.createObjectNode();
        }
    }


    /**
     * Builds a RestTemplate backed by a pooled Apache HttpClient 5.
     *
     * Why this matters:
     *   Default SimpleClientHttpRequestFactory creates a new TCP connection
     *   (+ TLS handshake ~150-200 ms) for every request to graphhopper.com.
     *   A pooled manager reuses existing connections — latency drops to ~20 ms
     *   for subsequent calls to the same host.
     */

    private RestTemplate buildPooledRestTemplate() {
        HttpClientConnectionManager connectionManager =
                PoolingHttpClientConnectionManagerBuilder.create()
                        .setMaxConnTotal(20)
                        .setMaxConnPerRoute(10)
                        .build();

        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(Timeout.ofSeconds(3))
                .setResponseTimeout(Timeout.ofSeconds(10))
                .build();

        HttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .setDefaultRequestConfig(requestConfig)
                .build();

        return new RestTemplate(new HttpComponentsClientHttpRequestFactory(httpClient));
    }


    public String routeFallback(double startLng, double startLat,
                                double endLng,   double endLat,
                                List<StopPointDTO> stopPoints,
                                String profile, Exception ex) {
        System.err.println("GraphHopper rate limit exceeded: " + ex.getMessage());
        return """
               {"type":"FeatureCollection","features":[],
                "error":"Rate limit exceeded. Please try again shortly."}
               """;
    }



}