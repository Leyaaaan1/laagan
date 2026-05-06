
package leyans.RidersHub.Service.MapService;

import com.fasterxml.jackson.databind.ObjectMapper;
import leyans.RidersHub.DTO.Request.LocationDTO.NominatimAddress;
import leyans.RidersHub.Service.MapService.utilities.ApiHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("NominatimService Unit Tests")
class NominatimServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ApiHelper apiHelper;

    private NominatimService nominatimService;
    private ObjectMapper objectMapper;


    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Create the service instance FIRST
        nominatimService = new NominatimService(restTemplate, apiHelper);

        // THEN use reflection to set the @Value fields
        try {
            java.lang.reflect.Field field = NominatimService.class.getDeclaredField("nominatimApiBase");
            field.setAccessible(true);
            field.set(nominatimService, "https://nominatim.openstreetmap.org");

            field = NominatimService.class.getDeclaredField("userAgent");
            field.setAccessible(true);
            field.set(nominatimService, "Mozilla/5.0");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ============ searchCityOrLandmark ============
    @Test
    @DisplayName("searchCityOrLandmark - Should return landmark results")
    void testSearchCityOrLandmark_Success() {
        // Arrange
        String query = "Ateneo";
        int limit = 5;

        Map<String, Object> result1 = new HashMap<>();
        result1.put("name", "Ateneo de Davao");
        Map<String, Object> address1 = new HashMap<>();
        address1.put("tourism", "university");
        result1.put("address", address1);

        String jsonResponse = "[{\"name\":\"Ateneo de Davao\",\"address\":{\"tourism\":\"university\"}}]";

        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(jsonResponse));

        // Act
        List<Map<String, Object>> results = nominatimService.searchCityOrLandmark(query, limit);

        // Assert
        assertThat(results).isNotEmpty();
        verify(restTemplate).exchange(anyString(), any(), any(), eq(String.class));
    }

    @Test
    @DisplayName("searchCityOrLandmark - Should return empty list on API error")
    void testSearchCityOrLandmark_ApiError() {
        // Arrange
        String query = "Ateneo";

        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(String.class)))
                .thenThrow(new RuntimeException("API Error"));

        // Act
        List<Map<String, Object>> results = nominatimService.searchCityOrLandmark(query, 5);

        // Assert
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("searchCityOrLandmark - Should use default limit of 5")
    void testSearchCityOrLandmark_DefaultLimit() {
        // Arrange
        String query = "Davao City";
        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok("[]"));

        // Act
        List<Map<String, Object>> results = nominatimService.searchCityOrLandmark(query);

        // Assert
        assertThat(results).isNotNull();
        verify(restTemplate).exchange(anyString(), any(), any(), eq(String.class));
    }

    // ============ searchLocation ============
    @Test
    @DisplayName("searchLocation - Should return location results")
    void testSearchLocation_Success() {
        // Arrange
        String query = "Lanang";
        int limit = 5;

        String jsonResponse = "[{\"name\":\"Lanang\",\"lat\":\"8.5\",\"lon\":\"125.5\"}]";

        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(List.class)))
                .thenReturn(ResponseEntity.ok(List.of(new HashMap<>())));

        // Act
        List<Map<String, Object>> results = nominatimService.searchLocation(query, limit);

        // Assert
        assertThat(results).isNotEmpty();
        verify(restTemplate).exchange(anyString(), any(), any(), eq(List.class));
    }

    @Test
    @DisplayName("searchLocation - Should return empty list on API failure")
    void testSearchLocation_ApiFailure() {
        // Arrange
        String query = "Unknown Place";

        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(List.class)))
                .thenThrow(new RuntimeException("API Failure"));

        // Act
        List<Map<String, Object>> results = nominatimService.searchLocation(query, 5);

        // Assert
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("searchLocation - Should use default limit of 5")
    void testSearchLocation_DefaultLimit() {
        // Arrange
        String query = "Calinog";
        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(List.class)))
                .thenReturn(ResponseEntity.ok(List.of()));

        // Act
        List<Map<String, Object>> results = nominatimService.searchLocation(query);

        // Assert
        assertThat(results).isNotNull();
        verify(restTemplate).exchange(anyString(), any(), any(), eq(List.class));
    }

    // ============ getCityOrLandmarkFromCoordinates ============
    @Test
    @DisplayName("getCityOrLandmarkFromCoordinates - Should return landmark for valid coordinates")
    void testGetCityOrLandmarkFromCoordinates_Success() {
        // Arrange
        double lat = 8.5, lon = 125.5;

        Map<String, Object> body = new HashMap<>();
        body.put("name", "Ateneo de Davao");
        Map<String, Object> address = new HashMap<>();
        address.put("tourism", "university");
        body.put("address", address);

        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(body));

        // Act
        Optional<NominatimAddress> result = nominatimService.getCityOrLandmarkFromCoordinates(lat, lon);

        // Assert
        assertThat(result).isPresent();
        verify(restTemplate).exchange(anyString(), any(), any(), eq(Map.class));
    }

    @Test
    @DisplayName("getCityOrLandmarkFromCoordinates - Should return empty Optional on API error")
    void testGetCityOrLandmarkFromCoordinates_ApiError() {
        // Arrange
        double lat = 8.5, lon = 125.5;

        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("API Error"));

        // Act
        Optional<NominatimAddress> result = nominatimService.getCityOrLandmarkFromCoordinates(lat, lon);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getCityOrLandmarkFromCoordinates - Should return empty Optional when address is null")
    void testGetCityOrLandmarkFromCoordinates_NullAddress() {
        // Arrange
        double lat = 8.5, lon = 125.5;

        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(new HashMap<>()));

        // Act
        Optional<NominatimAddress> result = nominatimService.getCityOrLandmarkFromCoordinates(lat, lon);

        // Assert
        assertThat(result).isEmpty();
    }

    // ============ getBarangayNameFromCoordinates ============
    @Test
    @DisplayName("getBarangayNameFromCoordinates - Should return barangay name")
    void testGetBarangayNameFromCoordinates_Success() {
        // Arrange
        double lat = 8.5, lon = 125.5;

        Map<String, Object> body = new HashMap<>();
        Map<String, String> address = new HashMap<>();
        address.put("village", "Poblacion");
        body.put("address", address);

        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(body));

        // Act
        String result = nominatimService.getBarangayNameFromCoordinates(lat, lon);

        // Assert
        assertThat(result).isEqualTo("Poblacion");
        verify(restTemplate).exchange(anyString(), any(), any(), eq(Map.class));
    }

    @Test
    @DisplayName("getBarangayNameFromCoordinates - Should return null on API error")
    void testGetBarangayNameFromCoordinates_ApiError() {
        // Arrange
        double lat = 8.5, lon = 125.5;

        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("API Error"));

        // Act
        String result = nominatimService.getBarangayNameFromCoordinates(lat, lon);

        // Assert
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("getBarangayNameFromCoordinates - Should fallback to neighbourhood when village is null")
    void testGetBarangayNameFromCoordinates_FallbackToNeighbourhood() {
        // Arrange
        double lat = 8.5, lon = 125.5;

        Map<String, Object> body = new HashMap<>();
        Map<String, String> address = new HashMap<>();
        address.put("neighbourhood", "Downtown");
        body.put("address", address);

        when(apiHelper.buildEntity()).thenReturn(null);
        when(restTemplate.exchange(anyString(), any(), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(body));

        // Act
        String result = nominatimService.getBarangayNameFromCoordinates(lat, lon);

        // Assert
        assertThat(result).isEqualTo("Downtown");
    }
}