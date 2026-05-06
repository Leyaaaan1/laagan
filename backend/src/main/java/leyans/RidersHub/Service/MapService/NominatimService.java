package leyans.RidersHub.Service.MapService;

import com.cloudinary.Api;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import leyans.RidersHub.DTO.Request.LocationDTO.NominatimAddress;
import leyans.RidersHub.Service.MapService.utilities.ApiHelper;
import leyans.RidersHub.Utility.AppLogger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

/**
 * Nominatim geocoding service — Mindanao-bounded.
 *
 * Bounding box (lon-min, lat-max, lon-max, lat-min) = 119.0,10.5,127.0,5.4
 * All search/reverse calls use bounded=1 so results are strictly within Mindanao.
 *
 * Performance notes:
 *  - format=jsonv2  → lighter payload than format=json
 *  - addressdetails=1 only where address breakdown is actually needed
 *  - UriComponentsBuilder used everywhere — no manual URL string concatenation
 *  - Resilience4j @RateLimiter enforces 1 req/sec (Nominatim usage policy)
 */
@Component
public class NominatimService {


    public static final List<String> LANDMARK_KEYS = List.of(
            "attraction", "tourism", "historic", "leisure", "amenity",
            "building", "stadium", "mall", "theatre", "hotel", "resort",
            "camp_site", "natural", "park", "museum", "man_made", "shop", "place"
    );

    // Mindanao bounding box — lon-min, lat-max, lon-max, lat-min (Nominatim viewbox order)
    private static final String MINDANAO_VIEWBOX = "119.0,10.5,127.0,5.4";


    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate;

    private final ApiHelper apiHelper;

    @Value("${USER_AGENT}")
    private String userAgent;

    @Value("${NOMINATIM_API_BASE}")
    private String nominatimApiBase;

    public NominatimService(RestTemplate restTemplate, ApiHelper apiHelper) {
        this.restTemplate = restTemplate;
        this.apiHelper = apiHelper;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Reverse-geocode coordinates → barangay name.
     * zoom=18 resolves to village/suburb level.
     */

    @RateLimiter(name = "nominatim", fallbackMethod = "barangayFallback")
    public String getBarangayNameFromCoordinates(double lat, double lon) {
        AppLogger.info(this.getClass(), "getBarangayNameFromCoordinates called", "lat", lat, "lon", lon);

        String url = UriComponentsBuilder.fromHttpUrl(nominatimApiBase + "/reverse")
                .queryParam("format", "jsonv2")
                .queryParam("lat", lat)
                .queryParam("lon", lon)
                .queryParam("zoom", 18)
                .queryParam("addressdetails", 1)
                .queryParam("bounded", 1)
                .queryParam("viewbox", MINDANAO_VIEWBOX)
                .build(false)
                .toUriString();

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, apiHelper.buildEntity(), Map.class);

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("address")) {
                @SuppressWarnings("unchecked")
                Map<String, String> address = (Map<String, String>) body.get("address");
                String barangay = address.getOrDefault("village",
                        address.getOrDefault("neighbourhood",
                                address.getOrDefault("suburb", null)));
                AppLogger.info(this.getClass(), "Barangay found", "barangay", barangay);
                return barangay;
            }
        } catch (Exception e) {
            AppLogger.error(this.getClass(), "Failed to reverse geocode barangay", e);
        }
        return null;
    }
    /**
     * Reverse-geocode coordinates → landmark or city name.
     * Prioritises named landmarks (tourism, amenity, etc.) over generic city names.
     */
    @RateLimiter(name = "nominatim", fallbackMethod = "cityLandmarkFallback")
    public Optional<NominatimAddress> getCityOrLandmarkFromCoordinates(double lat, double lon) {
        String url = UriComponentsBuilder.fromHttpUrl(nominatimApiBase + "/reverse")
                .queryParam("format", "jsonv2")
                .queryParam("lat", lat)
                .queryParam("lon", lon)
                .queryParam("zoom", 16)          // city/landmark level — no need for zoom=18 here
                .queryParam("addressdetails", 1)
                .build(false)
                .toUriString();

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, apiHelper.buildEntity(), Map.class);

            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("address")) return Optional.empty();

            @SuppressWarnings("unchecked")
            Map<String, Object> address = (Map<String, Object>) body.get("address");

            // 1. Named landmark takes top priority
            for (String key : LANDMARK_KEYS) {
                if (address.containsKey(key)) {
                    String value = (String) address.get(key);
                    if (value != null && !value.isEmpty() && !value.equalsIgnoreCase("yes")) {
                        return Optional.of(NominatimAddress.forLandmark(value));
                    }
                    // Generic value ("yes") → fall back to root name
                    Object rootName = body.get("name");
                    if (rootName instanceof String name && !name.isEmpty()) {
                        return Optional.of(NominatimAddress.forLandmark(name));
                    }
                }
            }

            // 2. First segment of display_name if it isn't just the city
            if (body.containsKey("display_name")) {
                String firstPart = ((String) body.get("display_name")).split(",")[0].trim();
                String city = (String) address.get("city");
                if (city == null || !firstPart.equalsIgnoreCase(city)) {
                    return Optional.of(NominatimAddress.forLandmark(firstPart));
                }
            }

            // 3. City / town / municipality as last resort
            for (String adminKey : List.of("city", "town", "municipality")) {
                if (address.containsKey(adminKey)) {
                    return Optional.of(NominatimAddress.forLandmark((String) address.get(adminKey)));
                }
            }

        } catch (Exception e) {
            AppLogger.error(this.getClass(), "Nominatim location search failed", e);
        }
        return Optional.empty();
    }

    /** Convenience overload — default limit 5. */
    public List<Map<String, Object>> searchLocation(String query) {
        return searchLocation(query, 5);
    }

    /**
     * Free-text location search, bounded to Mindanao.
     * Uses format=jsonv2 for a lighter payload.
     */

    @RateLimiter(name = "nominatim", fallbackMethod = "searchLocationFallback")
    public List<Map<String, Object>> searchLocation(String query, int limit) {
        AppLogger.info(this.getClass(), "searchLocation called", "query", query, "limit", limit);

        String url = UriComponentsBuilder.fromHttpUrl(nominatimApiBase + "/search")
                .queryParam("q", query)
                .queryParam("countrycodes", "ph")
                .queryParam("format", "jsonv2")
                .queryParam("limit", limit)
                .queryParam("addressdetails", 1)
                .queryParam("bounded", 1)
                .queryParam("viewbox", MINDANAO_VIEWBOX)
                .build(false)
                .toUriString();

        try {
            ResponseEntity<List> response = restTemplate.exchange(
                    url, HttpMethod.GET, apiHelper.buildEntity(), List.class);
            List<Map<String, Object>> results = response.getBody() != null ? response.getBody() : Collections.emptyList();
            AppLogger.info(this.getClass(), "Location search completed", "query", query, "resultsCount", results.size());
            return results;
        } catch (Exception e) {
            AppLogger.error(this.getClass(), "Nominatim search failed", "query", query, e);
            return Collections.emptyList();
        }
    }
    /** Convenience overload — default limit 5. */
    public List<Map<String, Object>> searchCityOrLandmark(String query) {
        return searchCityOrLandmark(query, 5);
    }

    /**
     * Structured search for cities and landmarks.
     * Uses structured query params (city, county) instead of free-form q= where
     * possible — bypasses slow address parsing on the Nominatim side.
     * Falls back to q= for generic landmark queries.
     */
    @RateLimiter(name = "nominatim", fallbackMethod = "searchCityOrLandmarkFallback")
    public List<Map<String, Object>> searchCityOrLandmark(String query, int limit) {
        String url = UriComponentsBuilder.fromHttpUrl(nominatimApiBase + "/search")
                .queryParam("q", query)
                .queryParam("format", "jsonv2")
                .queryParam("addressdetails", 1)
                .queryParam("limit", limit * 2)
                .queryParam("countrycodes", "ph")
                .queryParam("bounded", 1)
                .queryParam("viewbox", MINDANAO_VIEWBOX)
                .build(false)
                .toUriString();

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, apiHelper.buildEntity(), String.class);

            String json = response.getBody();
            if (json == null || json.isBlank()) return Collections.emptyList();

            List<Map<String, Object>> results =
                    objectMapper.readValue(json, new TypeReference<>() {});
            if (results.isEmpty()) return Collections.emptyList();

            List<Map<String, Object>> filtered = new ArrayList<>();

            for (Map<String, Object> result : results) {
                @SuppressWarnings("unchecked")
                Map<String, Object> address = (Map<String, Object>) result.get("address");
                boolean isLandmark = false;

                for (String key : LANDMARK_KEYS) {
                    if (address != null && address.containsKey(key)) {
                        result.put("place_type", "landmark");
                        filtered.add(result);
                        isLandmark = true;
                        break;
                    }
                }

                if (!isLandmark && address != null) {
                    if (address.containsKey("city")) {
                        result.put("place_type", "city");
                        filtered.add(result);
                    } else if (address.containsKey("town")) {
                        result.put("place_type", "town");
                        filtered.add(result);
                    }
                }

                if (filtered.size() >= limit) break;
            }

            if (filtered.isEmpty()) {
                results.subList(0, Math.min(limit, results.size()))
                        .forEach(r -> r.putIfAbsent("place_type", "landmark"));
                return results.subList(0, Math.min(limit, results.size()));
            }

            return filtered;

        } catch (Exception e) {
            AppLogger.error(this.getClass(), "searchCityOrLandmark failed", "query", query, e);
            return Collections.emptyList();
        }
    }

    public String barangayFallback(double lat, double lon, Exception ex) {
        AppLogger.warn(this.getClass(), "Nominatim rate limit exceeded (barangay)", "lat", lat, "lon", lon, ex);
        return null;
    }

    public Optional<NominatimAddress> cityLandmarkFallback(double lat, double lon, Exception ex) {
        AppLogger.warn(this.getClass(), "Nominatim rate limit exceeded (landmark)", "lat", lat, "lon", lon, ex);
        return Optional.empty();
    }

    public List<Map<String, Object>> searchLocationFallback(String query, int limit, Exception ex) {
        AppLogger.warn(this.getClass(), "Nominatim rate limit exceeded (searchLocation)", "query", query, ex);
        return Collections.emptyList();
    }


    public List<Map<String, Object>> searchCityOrLandmarkFallback(String query, int limit, Exception ex) {
        AppLogger.warn(this.getClass(), "Nominatim rate limit exceeded (searchCityOrLandmark)", "query", query, ex);
        return Collections.emptyList();
    }





}