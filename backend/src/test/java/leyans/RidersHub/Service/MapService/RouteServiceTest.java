
package leyans.RidersHub.Service.MapService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Service.MapService.utilities.ApiHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("RouteService Unit Tests")
class RouteServiceTest {

    @Mock
    private ApiHelper apiHelper;

    @Mock
    private RidesRepository ridesRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;


    private RouteService routeService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // Pass the mock restTemplate to the 4-parameter constructor
        routeService = new RouteService(apiHelper, ridesRepository, objectMapper, restTemplate);
    }

    @Test
    @DisplayName("getRouteDirections - Should return valid GeoJSON when API succeeds")
    void testGetRouteDirections_Success() throws Exception {
        // Arrange
        double startLng = 124.5, startLat = 8.5;
        double endLng = 125.5, endLat = 9.5;
        String profile = "driving-car";
        List<StopPointDTO> stopPoints = new ArrayList<>();

        // Mock the apiHelper
        List<String> points = List.of("8.5,124.5", "9.5,125.5");
        when(apiHelper.buildPointList(startLat, startLng, stopPoints, endLat, endLng))
                .thenReturn(points);

        when(apiHelper.mapProfile(profile)).thenReturn("car");

        String mockResponse = "{\"type\":\"FeatureCollection\",\"features\":[]}";

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(mockResponse));


        when(apiHelper.convertToGeoJson(mockResponse))
                .thenReturn("{\"type\":\"FeatureCollection\",\"features\":[]}");

        // Act
        String result = routeService.getRouteDirections(startLng, startLat, endLng, endLat,
                stopPoints, profile);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).contains("FeatureCollection");
        verify(apiHelper).buildPointList(startLat, startLng, stopPoints, endLat, endLng);
        verify(apiHelper).convertToGeoJson(mockResponse);
    }

    @Test
    @DisplayName("getRouteDirections - Should throw RuntimeException on API error")
    void testGetRouteDirections_ApiError() {
        // Arrange
        double startLng = 124.5, startLat = 8.5;
        double endLng = 125.5, endLat = 9.5;
        List<StopPointDTO> stopPoints = new ArrayList<>();

        when(apiHelper.buildPointList(anyDouble(), anyDouble(), anyList(), anyDouble(), anyDouble()))
                .thenReturn(List.of("8.5,124.5"));
        when(apiHelper.mapProfile(anyString())).thenReturn("car");

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenThrow(new RuntimeException("API Error"));

        // Act & Assert
        assertThatThrownBy(() -> routeService.getRouteDirections(
                startLng, startLat, endLng, endLat, stopPoints, "driving-car"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("getSavedRouteGeoJson - Should return valid JsonNode when route exists")
    void testGetSavedRouteGeoJson_Success() {
        // Arrange
        String generatedRidesId = "RIDE123";
        String routeGeoJson = "{\"type\":\"FeatureCollection\"}";

        when(ridesRepository.findRouteCoordinatesByGeneratedRidesId(generatedRidesId))
                .thenReturn(routeGeoJson);

        JsonNode mockNode = mock(JsonNode.class);
        try {
            when(objectMapper.readTree(routeGeoJson)).thenReturn(mockNode);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        // Act
        JsonNode result = routeService.getSavedRouteGeoJson(generatedRidesId);

        // Assert
        assertThat(result).isNotNull();
        verify(ridesRepository).findRouteCoordinatesByGeneratedRidesId(generatedRidesId);
    }

    @Test
    @DisplayName("getSavedRouteGeoJson - Should return empty ObjectNode when route is null")
    void testGetSavedRouteGeoJson_NullRoute() {
        // Arrange
        String generatedRidesId = "RIDE123";

        when(ridesRepository.findRouteCoordinatesByGeneratedRidesId(generatedRidesId))
                .thenReturn(null);

        when(objectMapper.createObjectNode()).thenReturn(new ObjectMapper().createObjectNode());

        // Act
        JsonNode result = routeService.getSavedRouteGeoJson(generatedRidesId);

        // Assert
        assertThat(result).isNotNull();
        verify(ridesRepository).findRouteCoordinatesByGeneratedRidesId(generatedRidesId);
    }

    @Test
    @DisplayName("routeFallback - Should return fallback error JSON")
    void testRouteFallback() {
        // Arrange
        double startLng = 124.5, startLat = 8.5;
        double endLng = 125.5, endLat = 9.5;
        Exception ex = new RuntimeException("Rate limit exceeded");

        // Act
        String result = routeService.routeFallback(startLng, startLat, endLng, endLat,
                new ArrayList<>(), "driving-car", ex);

        // Assert
        assertThat(result).contains("Rate limit exceeded");
        assertThat(result).contains("FeatureCollection");
    }
}