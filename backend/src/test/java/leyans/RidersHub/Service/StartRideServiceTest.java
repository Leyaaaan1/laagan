
package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Response.StartRideResponseDTO;
import leyans.RidersHub.ExceptionHandler.RideAuthorizationException;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Repository.StartedRideRepository;
import leyans.RidersHub.Utility.RidesUtil;
import leyans.RidersHub.Utility.StartedUtil;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.StartedRide;
import leyans.RidersHub.model.participant.ParticipantLocation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("StartRideService Unit Tests")
class StartRideServiceTest {

    @Mock
    private StartedRideRepository startedRideRepository;

    @Mock
    private RidesRepository ridesRepository;

    @Mock
    private StartedUtil startedUtil;

    @Mock
    private RidesUtil ridesUtil;

    private StartRideService startRideService;
    private GeometryFactory gf;
    private Rider testCreator;
    private Rider testParticipant;
    private Rides testRide;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        startRideService = new StartRideService(
                startedRideRepository, ridesRepository, startedUtil, ridesUtil
        );

        gf = new GeometryFactory();

        testCreator = new Rider();
        testCreator.setUsername("creator");
        testCreator.setId(1);

        testParticipant = new Rider();
        testParticipant.setUsername("participant");
        testParticipant.setId(2);

        testRide = new Rides();
        testRide.setGeneratedRidesId("RIDE123");
        testRide.setUsername(testCreator);
        testRide.setParticipants(Set.of(testParticipant));
        Point startPoint = gf.createPoint(new Coordinate(125.5, 8.5));
        testRide.setStartingLocation(startPoint);
    }

    // ============ startRide ============
    @Test
    @DisplayName("startRide - Should start ride successfully for ride creator")
    void testStartRide_Success() {
        // Arrange
        String generatedRidesId = "RIDE123";
        Point startPoint = testRide.getStartingLocation();

        when(startedUtil.authenticateAndGetInitiator()).thenReturn(testCreator);
        when(ridesUtil.validateAndGetRide(generatedRidesId, testCreator)).thenReturn(testRide);

        StartedRide savedStartedRide = new StartedRide();
        savedStartedRide.setId(1);
        savedStartedRide.setRide(testRide);
        savedStartedRide.setUsername(testCreator);
        savedStartedRide.setStartTime(LocalDateTime.now());
        savedStartedRide.setLocation(startPoint);
        savedStartedRide.setParticipants(new HashSet<>(testRide.getParticipants()));
        savedStartedRide.getParticipants().add(testCreator);

        when(startedRideRepository.save(any(StartedRide.class))).thenReturn(savedStartedRide);

        List<ParticipantLocation> participantLocations = new ArrayList<>();
        when(startedUtil.initializeParticipantLocations(
                eq(savedStartedRide), anyList(), eq(startPoint)))
                .thenReturn(participantLocations);

        StartRideResponseDTO mockResponse = new StartRideResponseDTO();
        when(startedUtil.buildStartRideResponse(
                savedStartedRide, testRide, participantLocations))
                .thenReturn(mockResponse);

        // Act
        StartRideResponseDTO result = startRideService.startRide(generatedRidesId);

        // Assert
        assertThat(result).isNotNull();
        verify(startedRideRepository).save(any(StartedRide.class));
        verify(ridesRepository).save(testRide);
        assertThat(testRide.getActive()).isTrue();
    }

    @Test
    @DisplayName("startRide - Should throw exception if user is not ride creator")
    void testStartRide_UnauthorizedUser() {
        // Arrange
        String generatedRidesId = "RIDE123";
        Rider otherUser = new Rider();
        otherUser.setUsername("otherUser");
        otherUser.setId(3);

        when(startedUtil.authenticateAndGetInitiator()).thenReturn(otherUser);
        when(ridesUtil.validateAndGetRide(generatedRidesId, otherUser)).thenReturn(testRide);

        // Act & Assert
        assertThatThrownBy(() -> startRideService.startRide(generatedRidesId))
                .isInstanceOf(RideAuthorizationException.class)
                .hasMessageContaining("Only the ride creator can start the ride");
    }

    @Test
    @DisplayName("startRide - Should throw exception if starting location is null")
    void testStartRide_NullStartingLocation() {
        // Arrange
        String generatedRidesId = "RIDE123";
        testRide.setStartingLocation(null);

        when(startedUtil.authenticateAndGetInitiator()).thenReturn(testCreator);
        when(ridesUtil.validateAndGetRide(generatedRidesId, testCreator)).thenReturn(testRide);

        // Act & Assert
        assertThatThrownBy(() -> startRideService.startRide(generatedRidesId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("valid starting location");
    }

    @Test
    @DisplayName("startRide - Should include all participants in started ride")
    void testStartRide_IncludesAllParticipants() {
        // Arrange
        String generatedRidesId = "RIDE123";
        Point startPoint = testRide.getStartingLocation();

        when(startedUtil.authenticateAndGetInitiator()).thenReturn(testCreator);
        when(ridesUtil.validateAndGetRide(generatedRidesId, testCreator)).thenReturn(testRide);

        ArgumentCaptor<StartedRide> savedRideCaptor = ArgumentCaptor.forClass(StartedRide.class);
        StartedRide expectedRide = new StartedRide();
        when(startedRideRepository.save(savedRideCaptor.capture())).thenReturn(expectedRide);

        when(startedUtil.initializeParticipantLocations(any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(startedUtil.buildStartRideResponse(any(), any(), any()))
                .thenReturn(new StartRideResponseDTO());

        // Act
        startRideService.startRide(generatedRidesId);

        // Assert
        StartedRide capturedRide = savedRideCaptor.getValue();
        assertThat(capturedRide.getParticipants())
                .contains(testCreator, testParticipant)
                .hasSize(2);
    }

    @Test
    @DisplayName("startRide - Should set ride to active")
    void testStartRide_RideBecomesActive() {
        // Arrange
        String generatedRidesId = "RIDE123";
        Point startPoint = testRide.getStartingLocation();
        testRide.setActive(false);

        when(startedUtil.authenticateAndGetInitiator()).thenReturn(testCreator);
        when(ridesUtil.validateAndGetRide(generatedRidesId, testCreator)).thenReturn(testRide);

        StartedRide savedRide = new StartedRide();
        when(startedRideRepository.save(any(StartedRide.class))).thenReturn(savedRide);
        when(startedUtil.initializeParticipantLocations(any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(startedUtil.buildStartRideResponse(any(), any(), any()))
                .thenReturn(new StartRideResponseDTO());

        // Act
        startRideService.startRide(generatedRidesId);

        // Assert
        assertThat(testRide.getActive()).isTrue();
        verify(ridesRepository).save(testRide);
    }


    @Test
    @DisplayName("deactivateRide - Should deactivate ride successfully")
    void testDeactivateRide_Success() {
        // Arrange
        String generatedRidesId = "RIDE123";
        testRide.setActive(true);  // START WITH ACTIVE RIDE (not false)

        StartedRide startedRide = new StartedRide();
        startedRide.setId(1);

        when(ridesRepository.findByGeneratedRidesId(generatedRidesId))
                .thenReturn(Optional.of(testRide));
        when(startedRideRepository.findByRideGeneratedRidesId(generatedRidesId))
                .thenReturn(Optional.of(startedRide));

        // Act
        startRideService.deactivateRide(generatedRidesId);

        // Assert
        assertThat(testRide.getActive()).isFalse();  // SHOULD BE FALSE AFTER DEACTIVATION
        verify(ridesRepository).save(testRide);
        verify(startedRideRepository).deleteRiderLocationsByStartedRideId(1);
        verify(startedRideRepository).deleteParticipantLocationsByStartedRideId(1);
    }

    @Test
    @DisplayName("deactivateRide - Should throw exception if ride not found")
    void testDeactivateRide_RideNotFound() {
        // Arrange
        String generatedRidesId = "NONEXISTENT";

        when(ridesRepository.findByGeneratedRidesId(generatedRidesId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> startRideService.deactivateRide(generatedRidesId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Ride not found");
    }
}
