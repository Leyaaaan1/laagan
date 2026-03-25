package leyans.RidersHub.Service.MapService.utilities;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import leyans.RidersHub.DTO.Request.LocationDTO.LocationImageDto;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.io.HttpClientConnectionManager;
import org.apache.hc.core5.util.Timeout;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Component
public class ApiHelper {

    @Value("${USER_AGENT}")
    private String userAgent;

    private final ObjectMapper objectMapper;

    public ApiHelper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }


    private static final Set<String> MINDANAO_CITIES = Set.of(
            "zamboanga", "dipolog", "dapitan", "pagadian", "isabela",
            "cagayan de oro", "iligan", "malaybalay", "valencia", "ozamiz",
            "tangub", "gingoog", "el salvador", "oroquieta",
            "davao", "tagum", "panabo", "mati", "digos", "samal",
            "general santos", "koronadal", "kidapawan", "tacurong",
            "butuan", "surigao", "bislig", "tandag", "cabadbaran", "bayugan",
            "cotabato", "marawi", "lamitan"
    );

    //Nominatim
    public HttpEntity<String> buildEntity() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept-Language", "en");
        headers.set("User-Agent", userAgent);
        // Ask for gzip — reduces payload over the wire
        headers.set("Accept-Encoding", "gzip, deflate");
        return new HttpEntity<>(headers);
    }

    //Route Service
    public List<String> buildPointList(double startLat, double startLng,
                                        List<StopPointDTO> stops,
                                        double endLat, double endLng) {
        List<String> points = new ArrayList<>();
        points.add(startLat + "," + startLng);
        if (stops != null) {
            for (StopPointDTO stop : stops) {
                if (stop.getStopLatitude() != 0.0 && stop.getStopLongitude() != 0.0) {
                    points.add(stop.getStopLatitude() + "," + stop.getStopLongitude());
                }
            }
        }
        points.add(endLat + "," + endLng);
        return points;
    }
    public String mapProfile(String riderType) {
        if (riderType == null) return "car";
        return switch (riderType) {
            case "Car"        -> "car";
            case "Cafe Racers"-> "car";
            case "Bicycle"    -> "bike";
            case "Scooter"    -> "scooter";
            case "Motorcycle" -> "motorcycle";
            case "Sidecar"    -> "car";
            default           -> "car";
        };
    }

    public String convertToGeoJson(String graphHopperJson) throws Exception {
        JsonNode root = objectMapper.readTree(graphHopperJson);
        JsonNode path = root.path("paths").get(0);

        if (path == null || path.isMissingNode()) {
            throw new RuntimeException("No route path returned from GraphHopper");
        }

        JsonNode coords       = path.path("points").path("coordinates");
        JsonNode instructions = path.path("instructions");

        return """
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
                     "duration": %s,
                     "instructions": %s
                   }
                 }]
               }
               """.formatted(
                objectMapper.writeValueAsString(coords),
                path.path("distance").asText("0"),
                path.path("time").asText("0"),
                objectMapper.writeValueAsString(extractInstructions(instructions))
        );
    }

    /** Pulls turn-by-turn instructions from GraphHopper's instructions array. */
    public List<Map<String, Object>> extractInstructions(JsonNode instructionsNode) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (!instructionsNode.isArray()) return result;

        for (JsonNode instruction : instructionsNode) {
            Map<String, Object> step = new HashMap<>();
            step.put("text",      instruction.path("text").asText(""));
            step.put("distance",  instruction.path("distance").asInt(0));
            step.put("time",      instruction.path("time").asInt(0));
            step.put("street",    instruction.path("street_name").asText(""));
            step.put("sign",      instruction.path("sign").asInt(0));

            JsonNode interval = instruction.path("interval");
            if (interval.isArray() && interval.size() >= 2) {
                step.put("interval", List.of(interval.get(0).asInt(), interval.get(1).asInt()));
            }
            result.add(step);
        }
        return result;
    }



    public String resolveThumbUrl(JsonNode info) {
        String thumb = info.path("thumburl").asText("");
        return thumb.isEmpty() ? info.path("url").asText("") : thumb;
    }

    /** Extract the shortest available license string from extmetadata. */
    public String extractLicense(JsonNode info) {
        JsonNode meta = info.path("extmetadata");
        if (meta.has("LicenseShortName")) {
            return meta.path("LicenseShortName").path("value").asText("Unknown");
        }
        if (meta.has("License")) {
            return meta.path("License").path("value").asText("Unknown");
        }
        return "Unknown";
    }

    /**
     * Pick the best N image titles from search results, skipping obvious
     * non-photos (maps, logos, diagrams, charts).
     */
    public List<String> pickBestTitles(JsonNode searchResults, int count) {
        List<String> titles = new ArrayList<>();

        for (JsonNode result : searchResults) {
            String title   = result.path("title").asText("").toLowerCase();
            String snippet = result.path("snippet").asText("").toLowerCase();

            if (title.contains("map")     || title.contains("logo") ||
                    title.contains("diagram") || title.contains("chart")) continue;
            if (snippet.contains("map")   || snippet.contains("logo")) continue;

            String actual = result.path("title").asText("");
            if (!actual.isEmpty()) {
                titles.add(actual);
                if (titles.size() == count) break;
            }
        }

        // Fill remaining slots without the quality filter if needed
        if (titles.size() < count) {
            for (JsonNode result : searchResults) {
                String t = result.path("title").asText("");
                if (!t.isEmpty() && !titles.contains(t)) {
                    titles.add(t);
                    if (titles.size() == count) break;
                }
            }
        }

        return titles;
    }

    /**
     * Appends "Philippines" (and "Mindanao" for known Mindanao cities) to the
     * search term so Wikimedia returns regionally relevant results.
     *
     * O(1) because MINDANAO_CITIES is a Set.
     */
    public String buildMindanaoSearchTerm(String locationName) {
        String lower    = locationName.toLowerCase();
        StringBuilder sb = new StringBuilder(locationName);

        if (!lower.contains("philippines") && !lower.contains("mindanao")) {
            sb.append(" Philippines");
        }
        if (isMindanaoCity(lower)) {
            sb.append(" Mindanao");
        }

        return sb.toString();
    }

    /** O(1) — Set.contains vs the original O(n) for-loop over a String[]. */
    public boolean isMindanaoCity(String lowerCaseLocationName) {
        // Direct match first
        if (MINDANAO_CITIES.contains(lowerCaseLocationName)) return true;
        // Substring match for compound names ("cagayan de oro city" etc.)
        return MINDANAO_CITIES.stream()
                .anyMatch(lowerCaseLocationName::contains);
    }



}
