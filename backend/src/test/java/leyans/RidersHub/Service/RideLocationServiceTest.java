
package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
import leyans.RidersHub.ExceptionHandler.UnauthorizedAccessException;
import leyans.RidersHub.Repository.*;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.*;
import leyans.RidersHub.model.participant.ParticipantLocation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("RideLocationService Unit Tests")
class RideLocationServiceTest {

    @Mock
    private RiderLocationRepository locationRepo;

    @Mock
    private PsgcDataRepository psgcDataRepository;

    @Mock
    private LocationService locationService;

    @Mock
    private StartedRideRepository startedRideRepository;

    @Mock
    private RiderUtil riderUtil;

    @Mock
    private ParticipantLocationRepository participantLocationRepository;

    private RideLocationService rideLocationService;
    private GeometryFactory gf;
    private Rider testRider;
    private StartedRide testStartedRide;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        rideLocationService = new RideLocationService(
                locationRepo, psgcDataRepository, locationService,
                startedRideRepository, riderUtil, participantLocationRepository
        );
        gf = new GeometryFactory();

        // Setup test data
        testRider = new Rider();
        testRider.setUsername("testUser");

        testStartedRide = new StartedRide();
        testStartedRide.setId(1);
        testStartedRide.setUsername(testRider);
    }

    // ============ updateLocation ============
    @Test
    @DisplayName("updateLocation - Should update location for ride owner")
    void testUpdateLocation_Owner_Success() {
        // Arrange
        Integer startedRideId = 1;
        double latitude = 8.5, longitude = 125.5;
        String username = "testUser";

        Point userPoint = gf.createPoint(new Coordinate(longitude, latitude));
        Point startPoint = gf.createPoint(new Coordinate(125.0, 8.0));

        when(riderUtil.findStartedRideById(startedRideId)).thenReturn(testStartedRide);
        when(riderUtil.getCurrentUsername()).thenReturn(username);
        when(riderUtil.findRiderByUsername(username)).thenReturn(testRider);

        testStartedRide.setParticipants(new HashSet<>());

        when(locationService.createPoint(longitude, latitude)).thenReturn(userPoint);
        when(locationService.resolveBarangayName(null, latitude, longitude)).thenReturn("Poblacion");
        when(locationRepo.getDistanceBetweenPoints(userPoint, startPoint)).thenReturn(500.0);

        testStartedRide.setLocation(startPoint);

        RiderLocation riderLocation = new RiderLocation();
        riderLocation.setId(1);
        when(locationRepo.findFirstByStartedRideAndUsernameOrderByIdDesc(testStartedRide, testRider))
                .thenReturn(Optional.of(riderLocation));
        when(locationRepo.save(any(RiderLocation.class))).thenReturn(riderLocation);

        PsgcData psgcData = new PsgcData();
        psgcData.setName("Poblacion");
        when(psgcDataRepository.findByNameIgnoreCase("Poblacion"))
                .thenReturn(List.of(psgcData));

        // Act
        LocationUpdateRequestDTO result = rideLocationService.updateLocation(startedRideId, latitude, longitude);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getLatitude()).isEqualTo(latitude);
        assertThat(result.getLongitude()).isEqualTo(longitude);
        assertThat(result.getUsername()).isEqualTo(username);
        verify(locationRepo).save(any(RiderLocation.class));
    }

    @Test
    @DisplayName("updateLocation - Should throw UnauthorizedException for unauthorized user")
    void testUpdateLocation_Unauthorized() {
        // Arrange
        Integer startedRideId = 1;
        String currentUser = "otherUser";
        testStartedRide.setParticipants(new HashSet<>());

        when(riderUtil.findStartedRideById(startedRideId)).thenReturn(testStartedRide);
        when(riderUtil.getCurrentUsername()).thenReturn(currentUser);
        when(riderUtil.findRiderByUsername(currentUser)).thenReturn(new Rider());

        // Act & Assert
        assertThatThrownBy(() -> rideLocationService.updateLocation(startedRideId, 8.5, 125.5))
                .isInstanceOf(UnauthorizedAccessException.UnauthorizedException.class);
    }

    // ============ getLatestParticipantLocations ============
    @Test
    @DisplayName("getLatestParticipantLocations - Should return all participant locations")
    void testGetLatestParticipantLocations_Success() {
        // Arrange
        Integer startedRideId = 1;

        Point point = gf.createPoint(new Coordinate(125.5, 8.5));
        RiderLocation loc = new RiderLocation();
        loc.setLocation(point);
        loc.setUsername(testRider);
        loc.setLocationName("Poblacion");
        loc.setDistanceMeters(100.0);
        loc.setTimestamp(LocalDateTime.now());

        when(riderUtil.findStartedRideById(startedRideId)).thenReturn(testStartedRide);
        when(locationRepo.findLatestLocationPerParticipantOptimized(startedRideId))
                .thenReturn(List.of(loc));
        when(participantLocationRepository.findByStartedRideAndRider(testStartedRide, testRider))
                .thenReturn(List.of());

        // Act
        List<LocationUpdateRequestDTO> results = rideLocationService.getLatestParticipantLocations(startedRideId);

        // Assert
        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getUsername()).isEqualTo("testUser");
        assertThat(results.get(0).getLocationName()).isEqualTo("Poblacion");
    }

    @Test
    @DisplayName("getLatestParticipantLocations - Should use fallback location when live location unavailable")
    void testGetLatestParticipantLocations_WithFallback() {
        // Arrange
        Integer startedRideId = 1;
        Rider participant = new Rider();
        participant.setUsername("participant");
        testStartedRide.setParticipants(Set.of(participant));

        Point point = gf.createPoint(new Coordinate(125.0, 8.0));
        ParticipantLocation pLoc = new ParticipantLocation();
        pLoc.setParticipantLocation(point);
        pLoc.setRider(participant);
        pLoc.setLastUpdate(LocalDateTime.now());

        when(riderUtil.findStartedRideById(startedRideId)).thenReturn(testStartedRide);
        when(locationRepo.findLatestLocationPerParticipantOptimized(startedRideId))
                .thenReturn(List.of());
        when(riderUtil.findRiderByUsername("participant")).thenReturn(participant);
        when(participantLocationRepository.findByStartedRideAndRider(testStartedRide, participant))
                .thenReturn(List.of(pLoc));

        // Act
        List<LocationUpdateRequestDTO> results = rideLocationService.getLatestParticipantLocations(startedRideId);

        // Assert
        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getUsername()).isEqualTo("participant");
    }

    // ============ updateLocationAndFetchAll ============
    @Test
    @DisplayName("updateLocationAndFetchAll - Should update location and return all locations")
    void testUpdateLocationAndFetchAll_Success() {
        // Arrange
        Integer startedRideId = 1;
        double latitude = 8.5, longitude = 125.5;
        String username = "testUser";

        Point userPoint = gf.createPoint(new Coordinate(longitude, latitude));
        Point startPoint = gf.createPoint(new Coordinate(125.0, 8.0));

        when(riderUtil.findStartedRideById(startedRideId)).thenReturn(testStartedRide);
        when(riderUtil.getCurrentUsername()).thenReturn(username);
        when(riderUtil.findRiderByUsername(username)).thenReturn(testRider);

        testStartedRide.setParticipants(new HashSet<>());
        testStartedRide.setLocation(startPoint);

        when(locationService.createPoint(longitude, latitude)).thenReturn(userPoint);
        when(locationService.resolveBarangayName(null, latitude, longitude)).thenReturn("Poblacion");
        when(locationRepo.getDistanceBetweenPoints(userPoint, startPoint)).thenReturn(500.0);

        RiderLocation riderLocation = new RiderLocation();
        riderLocation.setId(1);
        riderLocation.setLocation(userPoint);
        riderLocation.setUsername(testRider);
        riderLocation.setLocationName("Poblacion");
        riderLocation.setDistanceMeters(500.0);
        riderLocation.setTimestamp(LocalDateTime.now());

        when(locationRepo.findFirstByStartedRideAndUsernameOrderByIdDesc(testStartedRide, testRider))
                .thenReturn(Optional.of(riderLocation));
        when(locationRepo.save(any(RiderLocation.class))).thenReturn(riderLocation);

        PsgcData psgcData = new PsgcData();
        psgcData.setName("Poblacion");
        when(psgcDataRepository.findByNameIgnoreCase("Poblacion"))
                .thenReturn(List.of(psgcData));

        when(locationRepo.findLatestLocationPerParticipantOptimized(startedRideId))
                .thenReturn(List.of(riderLocation));

        // Act
        List<LocationUpdateRequestDTO> results = rideLocationService.updateLocationAndFetchAll(
                startedRideId, latitude, longitude
        );

        // Assert
        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getUsername()).isEqualTo("testUser");
        verify(locationRepo).save(any(RiderLocation.class));
    }
}
