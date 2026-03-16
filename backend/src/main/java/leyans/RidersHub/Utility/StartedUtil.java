package leyans.RidersHub.Utility;

import leyans.RidersHub.DTO.Request.ParticipantLocationDTO;
import leyans.RidersHub.DTO.Response.RideResponseDTO;
import leyans.RidersHub.DTO.Response.StartRideResponseDTO;
import leyans.RidersHub.Repository.ParticipantLocationRepository;
import leyans.RidersHub.Repository.StartedRideRepository;
import leyans.RidersHub.Service.LocationService;
import leyans.RidersHub.Service.RidesService;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.StartedRide;
import leyans.RidersHub.model.participant.ParticipantLocation;
import org.locationtech.jts.geom.Point;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StartedUtil {

    private final RiderUtil riderUtil;
    private final ParticipantLocationRepository participantLocationRepository;
    private final LocationService locationService;

    private final StartedRideRepository startedRideRepository;

    private final RidesService ridesService;
    private final RidesUtil ridesUtil;

    public StartedUtil(RiderUtil riderUtil, ParticipantLocationRepository participantLocationRepository, LocationService locationService, StartedRideRepository startedRideRepository, RidesService ridesService, RidesUtil ridesUtil) {
        this.riderUtil = riderUtil;
        this.participantLocationRepository = participantLocationRepository;
        this.locationService = locationService;
        this.startedRideRepository = startedRideRepository;
        this.ridesService = ridesService;
        this.ridesUtil = ridesUtil;
    }



    public Rider authenticateAndGetInitiator() throws AccessDeniedException {
        String username = riderUtil.getCurrentUsername();
        Rider initiator = riderUtil.findRiderByUsername(username);

        if (initiator == null) {
            throw new AccessDeniedException("Rider not found with username: " + username);
        }

        return initiator;
    }



    public List<ParticipantLocation> initializeParticipantLocations(
            StartedRide startedRide,
            List<Rider> participants,
            Point startingPoint) {

        List<ParticipantLocation> locations = new ArrayList<>();

        for (Rider participant : participants) {
            ParticipantLocation location = new ParticipantLocation();
            location.setStartedRide(startedRide);
            location.setRider(participant);

            // Create a new Point instance for each participant with the same coordinates
            Point participantStartPoint = locationService.createPoint(
                    startingPoint.getX(),  // longitude
                    startingPoint.getY()   // latitude
            );

            // Use the correct setter name from ParticipantLocation entity
            location.setParticipantLocation(participantStartPoint);  // Changed from setLocation
            location.setLastUpdate(LocalDateTime.now());  // Changed from setLastUpdated

            locations.add(participantLocationRepository.save(location));
        }

        return locations;
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public RideResponseDTO getStartedRideDetails() throws AccessDeniedException {
        // Get the authenticated user
        Rider requester = authenticateAndGetInitiator();

        // Find the started ride by the initiator (username field in StartedRide)
        Optional<StartedRide> startedRide = startedRideRepository.findByUsernameWithRide(requester);

        if (startedRide.isEmpty()) {
            throw new IllegalArgumentException("No active ride found for user");
        }

        // Return the ride details from the started ride
        return mapToRideResponseDTO(startedRide.get().getRide());
    }

    public RideResponseDTO mapToRideResponseDTO(Rides ride) {
        return new RideResponseDTO(
                ride.getGeneratedRidesId(),
                ride.getLocationName(),
                ride.getRidesName(),
                ride.getRiderType(),
                ride.getDistance(),
                ride.getDate(),
                ride.getLocation().getY(),
                ride.getLocation().getX(),
                ride.getParticipants().stream().map(Rider::getUsername).toList(),
                ride.getDescription(),
                ride.getStartingPointName(),
                ride.getStartingLocation().getY(),
                ride.getStartingLocation().getX(),
                ride.getEndingPointName(),
                ride.getEndingLocation().getY(),
                ride.getEndingLocation().getX(),
                ride.getMapImageUrl(),
                ride.getMagImageStartingLocation(),
                ride.getMagImageEndingLocation(),
                ride.getUsername().getUsername(),
                ride.getRouteCoordinates(),
                ridesUtil.mapStopPointsToDTOs(ride.getStopPoints()),
                ride.getActive()
        );
    }

    public StartRideResponseDTO buildStartRideResponse(
            StartedRide startedRide,
            Rides ride,
            List<ParticipantLocation> participantLocations) {

        StartRideResponseDTO response = new StartRideResponseDTO();
        response.setGeneratedRidesId(ride.getGeneratedRidesId());
        response.setRidesName(ride.getRidesName());
        response.setLocationName(ride.getLocationName());

        // Get the ride's starting location
        Point startPoint = ride.getStartingLocation();
        if (startPoint != null) {
            response.setStartLatitude(startPoint.getY());  // latitude
            response.setStartLongitude(startPoint.getX()); // longitude
        }

        response.setStartPointName(ride.getStartingPointName());
        response.setLatitude(ride.getLocation().getY());
        response.setLongitude(ride.getLocation().getX());
        response.setStartTime(startedRide.getStartTime());
        response.setInitiator(startedRide.getUsername().getUsername());
        response.setRouteCoordinates(ride.getRouteCoordinates());
        response.setEstimatedDistance(ride.getDistance());

        // Map participant locations
        List<ParticipantLocationDTO> participantDTOs = participantLocations.stream()
                .map(pl -> new ParticipantLocationDTO(
                        pl.getRider().getUsername(),
                        pl.getParticipantLocation().getY(),  // latitude
                        pl.getParticipantLocation().getX(),  // longitude
                        pl.getLastUpdate()
                ))
                .collect(Collectors.toList());

        response.setParticipants(participantDTOs);
        response.setParticipantUsernames(
                participantLocations.stream()
                        .map(pl -> pl.getRider().getUsername())
                        .collect(Collectors.toList())
        );

        return response;
    }


}
