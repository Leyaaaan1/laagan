package leyans.RidersHub.Service.MapService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import leyans.RidersHub.DTO.Request.LocationDTO.LocationImageDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Service
public class WikimediaImageService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${USER_AGENT}")
    private String userAgent;

    private static final String WIKIMEDIA_API_BASE = "https://commons.wikimedia.org/w/api.php";

    public WikimediaImageService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }


    @Cacheable(value = "locationImages", key = "#locationName.toLowerCase().trim()")
    public List<LocationImageDto> getLocationImage(String locationName) {
        System.out.println("Fetching images from Wikimedia API for: " + locationName);
        try {
            String enhancedSearchTerm = enhanceSearchForMindanao(locationName);

            String searchUrl = UriComponentsBuilder.fromHttpUrl(WIKIMEDIA_API_BASE)
                    .queryParam("action", "query")
                    .queryParam("format", "json")
                    .queryParam("list", "search")
                    .queryParam("srsearch", enhancedSearchTerm)
                    .queryParam("srnamespace", "6") // File namespace
                    .queryParam("srlimit", "10") // Get more results
                    .build()
                    .toUriString();

            HttpHeaders headers = createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> searchResponse = restTemplate.exchange(
                    searchUrl,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            String searchResponseBody = searchResponse.getBody();

            // Check if response is null
            if (searchResponseBody == null) {
                System.err.println("Search response is null for: " + locationName);
                return new ArrayList<>();
            }

            JsonNode searchJson = objectMapper.readTree(searchResponseBody);

            JsonNode searchResults = searchJson.path("query").path("search");
            if (!searchResults.isArray() || searchResults.size() == 0) {
                System.out.println("No search results found for: " + locationName);
                return new ArrayList<>();
            }

            List<String> fileTitles = findTopImageTitles(searchResults, 4);
            if (fileTitles.isEmpty()) {
                System.out.println("No suitable image titles found for: " + locationName);
                return new ArrayList<>();
            }

            List<LocationImageDto> images = new ArrayList<>();

            for (String fileName : fileTitles) {
                try {
                    String imageInfoUrl = UriComponentsBuilder.fromHttpUrl(WIKIMEDIA_API_BASE)
                            .queryParam("action", "query")
                            .queryParam("format", "json")
                            .queryParam("titles", fileName)
                            .queryParam("prop", "imageinfo")
                            .queryParam("iiprop", "url|user|extmetadata")
                            .queryParam("iiurlwidth", "800")
                            .build()
                            .toUriString();

                    HttpHeaders imageHeaders = createHeaders();
                    HttpEntity<String> imageEntity = new HttpEntity<>(imageHeaders);
                    ResponseEntity<String> imageInfoResponse = restTemplate.exchange(
                            imageInfoUrl,
                            HttpMethod.GET,
                            imageEntity,
                            String.class
                    );
                    String imageInfoResponseBody = imageInfoResponse.getBody();

                    // Check if response is null
                    if (imageInfoResponseBody == null) {
                        System.err.println("Image info response is null for: " + fileName);
                        continue;
                    }

                    JsonNode imageInfoJson = objectMapper.readTree(imageInfoResponseBody);

                    JsonNode pages = imageInfoJson.path("query").path("pages");

                    // Check if pages exists and has elements
                    if (!pages.elements().hasNext()) {
                        System.err.println("No pages found in response for: " + fileName);
                        continue;
                    }

                    JsonNode page = pages.elements().next();

                    // Check if imageinfo exists
                    if (!page.has("imageinfo") || page.path("imageinfo").size() == 0) {
                        System.err.println("No imageinfo found for: " + fileName);
                        continue;
                    }

                    JsonNode imageInfo = page.path("imageinfo").get(0);

                    // Get image URL with fallback
                    String imageUrl = imageInfo.path("thumburl").asText("");
                    if (imageUrl.isEmpty()) {
                        imageUrl = imageInfo.path("url").asText("");
                    }

                    // Skip if no valid URL found
                    if (imageUrl.isEmpty()) {
                        System.err.println("No valid image URL found for: " + fileName);
                        continue;
                    }

                    String author = imageInfo.path("user").asText("Unknown");

                    String license = "Unknown";
                    JsonNode extMetadata = imageInfo.path("extmetadata");
                    if (extMetadata.has("LicenseShortName")) {
                        license = extMetadata.path("LicenseShortName").path("value").asText("Unknown");
                    } else if (extMetadata.has("License")) {
                        license = extMetadata.path("License").path("value").asText("Unknown");
                    }

                    images.add(new LocationImageDto(imageUrl, author, license));

                } catch (Exception e) {
                    System.err.println("Error processing image " + fileName + ": " + e.getMessage());
                    // Continue with next image instead of failing completely
                }
            }

            return images;

        } catch (Exception e) {
            System.err.println("Failed to fetch images from Wikimedia Commons for " + locationName + ": " + e.getMessage());
            e.printStackTrace();
            // Return empty list instead of throwing exception
            return new ArrayList<>();
        }
    }

    @Cacheable(value = "locationImages", key = "#locationName.toLowerCase().trim()", condition = "false")
    public List<LocationImageDto> checkCachedLocationImage(String locationName) {
        return null; // This will only return the cached value
    }

    private List<String> findTopImageTitles(JsonNode searchResults, int count) {
        List<String> titles = new ArrayList<>();
        for (JsonNode result : searchResults) {
            String title = result.path("title").asText("").toLowerCase();
            String snippet = result.path("snippet").asText("").toLowerCase();

            if (title.contains("map") || title.contains("logo") || title.contains("diagram") || title.contains("chart")) continue;
            if (snippet.contains("map") || snippet.contains("logo")) continue;

            String actualTitle = result.path("title").asText("");
            if (!actualTitle.isEmpty()) {
                titles.add(actualTitle);
                if (titles.size() == count) break;
            }
        }

        // Fill up with remaining results if needed
        if (titles.size() < count) {
            for (JsonNode result : searchResults) {
                String title = result.path("title").asText("");
                if (!title.isEmpty() && !titles.contains(title)) {
                    titles.add(title);
                    if (titles.size() == count) break;
                }
            }
        }

        return titles;
    }

    private String enhanceSearchForMindanao(String locationName) {
        String enhanced = locationName;

        if (!locationName.toLowerCase().contains("philippines") &&
                !locationName.toLowerCase().contains("mindanao")) {
            enhanced += " Philippines";
        }

        if (isMindanaoCity(locationName)) {
            enhanced += " Mindanao";
        }

        return enhanced;
    }

    private boolean isMindanaoCity(String locationName) {
        String[] mindanaoCities = {
                "zamboanga", "dipolog", "dapitan", "pagadian", "isabela",
                "cagayan de oro", "iligan", "malaybalay", "valencia", "ozamiz",
                "tangub", "gingoog", "el salvador", "oroquieta",
                "davao", "tagum", "panabo", "mati", "digos", "samal",
                "general santos", "koronadal", "kidapawan", "tacurong",
                "butuan", "surigao", "bislig", "tandag", "cabadbaran", "bayugan",
                "cotabato", "marawi", "lamitan"
        };

        String lowerLocation = locationName.toLowerCase();
        for (String city : mindanaoCities) {
            if (lowerLocation.contains(city)) {
                return true;
            }
        }
        return false;
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", userAgent);
        return headers;
    }
}