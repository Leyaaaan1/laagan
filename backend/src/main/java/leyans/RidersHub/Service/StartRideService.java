package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Response.StartRideResponseDTO;
import leyans.RidersHub.ExceptionHandler.RideAuthorizationException;
import leyans.RidersHub.Repository.RideCheckpointArrivalRepository;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Repository.StartedRideRepository;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.RidesUtil;
import leyans.RidersHub.Utility.StartedUtil;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.StartedRide;
import leyans.RidersHub.model.participant.ParticipantLocation;
import leyans.RidersHub.model.participant.RideCheckpointArrival;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class StartRideService {

    private final StartedRideRepository startedRideRepository;
    private final RidesRepository ridesRepository;

    private final StartedUtil startedUtil;
    private final RidesUtil ridesUtil;
    private final RideLocationService rideLocationService;

    private final RideStatusService rideStatusService;
    private final RideCheckpointArrivalRepository rideCheckpointArrivalRepository;

    public StartRideService(StartedRideRepository startedRideRepository, RidesRepository ridesRepository,
                            StartedUtil startedUtil, RidesUtil ridesUtil, RideLocationService rideLocationService, RideStatusService rideStatusService, RideCheckpointArrivalRepository rideCheckpointArrivalRepository) {
        this.startedRideRepository = startedRideRepository;
        this.ridesRepository = ridesRepository;
        this.startedUtil = startedUtil;
        this.ridesUtil = ridesUtil;
        this.rideLocationService = rideLocationService;
        this.rideStatusService = rideStatusService;
        this.rideCheckpointArrivalRepository = rideCheckpointArrivalRepository;
    }

    @Transactional
    public StartRideResponseDTO startRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "startRide called", "generatedRidesId", generatedRidesId);
        Rider initiator = startedUtil.authenticateAndGetInitiator();
        Rides ride = ridesUtil.validateAndGetRide(generatedRidesId, initiator);

        boolean isCreator = ride.getUsername().getUsername().equals(initiator.getUsername());
        if (!isCreator) {
            AppLogger.warn(this.getClass(), "Unauthorized ride start attempt",
                    "initiator", initiator.getUsername(), "rideId", generatedRidesId);
            throw new RideAuthorizationException("Only the ride creator can start the ride");
        }

        Point startingPoint = ride.getStartingLocation();

        if (startingPoint == null) {
            AppLogger.throwInvalidRequest(this.getClass(), "Ride does not have a valid starting location");
            throw new RuntimeException("Ride does not have a valid starting location");
        }

        StartedRide startedRide = new StartedRide();
        startedRide.setRide(ride);
        startedRide.setUsername(initiator);
        startedRide.setStartTime(LocalDateTime.now());
        startedRide.setLocation(startingPoint);

        Set<Rider> allParticipants = new HashSet<>(ride.getParticipants());
        allParticipants.add(ride.getUsername()); // no duplicate check needed, Set handles it

        startedRide.setParticipants(allParticipants);
        startedRide = startedRideRepository.save(startedRide);
        AppLogger.info(this.getClass(), "Ride started successfully", "rideId", generatedRidesId);

        ride.setActive(true);
        ridesRepository.save(ride);
        rideStatusService.markStarted(generatedRidesId);

        List<ParticipantLocation> participantLocations = startedUtil.initializeParticipantLocations(
                startedRide,
                new ArrayList<>(allParticipants),
                startingPoint
        );

        return startedUtil.buildStartRideResponse(startedRide, ride, participantLocations);
    }





    @Transactional
    public void leaveRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "leaveRide called", "generatedRidesId", generatedRidesId);

        Rider rider = startedUtil.authenticateAndGetInitiator();

        // Find the active started ride
        StartedRide startedRide = startedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("No active ride found: " + generatedRidesId));
        rideLocationService.clearRiderLocation(
                startedRide.getId(),
                rider.getUsername()
        );
        Rides ride = startedRide.getRide();

        // Check if caller is actually a participant
        boolean isParticipant = startedRide.getParticipants()
                .stream()
                .anyMatch(p -> p.getUsername().equals(rider.getUsername()));
        if (!isParticipant) {
            throw new IllegalStateException(
                    "You are not a participant of this ride: " + generatedRidesId);
        }

        // Check if the leaving rider is the creator
        boolean isCreator = ride.getUsername().getUsername().equals(rider.getUsername());

        // Remove the rider from both participant sets
        startedRide.getParticipants().remove(rider);
        ride.getParticipants().remove(rider);

        Set<Rider> remainingParticipants = startedRide.getParticipants();

        // If no one is left (last participant, whether creator or not) — fully clean up
        if (remainingParticipants.isEmpty()) {
            AppLogger.info(this.getClass(), "Last participant left. Cleaning up and deactivating ride.",
                    "generatedRidesId", generatedRidesId);
            startedRideRepository.deleteRiderLocationsByStartedRideId(generatedRidesId);
            startedRideRepository.deleteParticipantLocationsByStartedRideId(generatedRidesId);
            startedRideRepository.deleteParticipantsByStartedRideId(generatedRidesId);
            startedRideRepository.delete(startedRide);
            startedRideRepository.flush();
            ride.setActive(false);
            ridesRepository.save(ride);
            AppLogger.info(this.getClass(), "Ride cleaned up and deactivated",
                    "generatedRidesId", generatedRidesId);
            return;
        }

        // If creator is leaving but others remain — transfer ownership to a random participant
        if (isCreator) {
            Rider newCreator = remainingParticipants.iterator().next();

            ride.setUsername(newCreator);
            startedRide.setUsername(newCreator);

            AppLogger.info(this.getClass(), "Creator left; transferred ownership to new creator",
                    "previousCreator", rider.getUsername(),
                    "newCreator", newCreator.getUsername(),
                    "generatedRidesId", generatedRidesId);
        }

        startedRideRepository.save(startedRide);
        ridesRepository.save(ride);

        AppLogger.info(this.getClass(), "Rider left ride successfully",
                "rider", rider.getUsername(), "generatedRidesId", generatedRidesId);
    }
    @Transactional
    public void deactivateRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "deactivateRide called", "generatedRidesId", generatedRidesId);

        Rider initiator = startedUtil.authenticateAndGetInitiator();

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> {
                    AppLogger.warn(this.getClass(), "Ride not found for deactivation", "rideId", generatedRidesId);
                    return new IllegalArgumentException("Ride not found: " + generatedRidesId);
                });



        boolean isCreator = ride.getUsername().getUsername().equals(initiator.getUsername());
        if (!isCreator) {
            AppLogger.warn(this.getClass(), "Unauthorized ride stop attempt",
                    "initiator", initiator.getUsername(), "rideId", generatedRidesId);
            throw new RideAuthorizationException("Only the current ride creator can stop the ride");
        }

        startedRideRepository.findByRideGeneratedRidesId(generatedRidesId).ifPresent(startedRide -> {
            startedRideRepository.deleteRiderLocationsByStartedRideId(generatedRidesId);
            startedRideRepository.deleteParticipantLocationsByStartedRideId(generatedRidesId);
            startedRideRepository.deleteParticipantsByStartedRideId(generatedRidesId);
            startedRideRepository.delete(startedRide);
            startedRideRepository.flush();
        });

        ride.setActive(false);
        AppLogger.info(this.getClass(), "Ride deactivated successfully", "generatedRidesId", generatedRidesId);
        ridesRepository.save(ride);
    }
}