package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Response.StartRideResponseDTO;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Repository.StartedRideRepository;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.RidesUtil;
import leyans.RidersHub.Utility.StartedUtil;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.StartedRide;
import leyans.RidersHub.model.participant.ParticipantLocation;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class StartRideService {

    private final StartedRideRepository startedRideRepository;
    private final RidesRepository ridesRepository;

    private final StartedUtil startedUtil;
    private final RidesUtil ridesUtil;

    @Autowired
    public StartRideService(StartedRideRepository startedRideRepository, RidesRepository ridesRepository,
                            StartedUtil startedUtil, RidesUtil ridesUtil) {
        this.startedRideRepository = startedRideRepository;
        this.ridesRepository = ridesRepository;
        this.startedUtil = startedUtil;
        this.ridesUtil = ridesUtil;
    }

    @Transactional
    public StartRideResponseDTO startRide(String generatedRidesId) throws AccessDeniedException {
        AppLogger.info(this.getClass(), "startRide called", "generatedRidesId", generatedRidesId);
        Rider initiator = startedUtil.authenticateAndGetInitiator();
        Rides ride = ridesUtil.validateAndGetRide(generatedRidesId, initiator);

        boolean isCreator = ride.getUsername().getUsername().equals(initiator.getUsername());
        if (!isCreator) {
            AppLogger.throwUnauthorized(this.getClass(), "Only the ride creator can start the ride");
            throw new AccessDeniedException("Only the ride creator can start the ride");

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

        // ✅ Use Set — creator is automatically deduped
        Set<Rider> allParticipants = new HashSet<>(ride.getParticipants());
        allParticipants.add(ride.getUsername()); // no duplicate check needed, Set handles it

        startedRide.setParticipants(allParticipants);
        startedRide = startedRideRepository.save(startedRide);
        AppLogger.info(this.getClass(), "Ride started successfully", "rideId", generatedRidesId);
        ride.setActive(true);
        ridesRepository.save(ride);

        // ✅ Convert to List only for initializeParticipantLocations (it expects List<Rider>)
        List<ParticipantLocation> participantLocations = startedUtil.initializeParticipantLocations(
                startedRide,
                new ArrayList<>(allParticipants),
                startingPoint
        );

        return startedUtil.buildStartRideResponse(startedRide, ride, participantLocations);
    }


    @Transactional
    public void deactivateRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "deactivateRide called", "generatedRidesId", generatedRidesId);
        // 1. Find the ride — generatedRidesId is NOT the PK, so use findByGeneratedRidesId
        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> {
                    AppLogger.warn(this.getClass(), "Ride not found for deactivation", "rideId", generatedRidesId);
                    return new IllegalArgumentException("Ride not found: " + generatedRidesId);
                });

        // 2. Find the StartedRide and delete it first (breaks the FK constraint before touching Rides)
        startedRideRepository.findByRideGeneratedRidesId(generatedRidesId).ifPresent(startedRide -> {
            Integer startedRideId = startedRide.getId();

            // CRITICAL: Delete in correct FK order
            // Step 1: Delete rider_locations rows (NEW - for location sharing feature)
            startedRideRepository.deleteRiderLocationsByStartedRideId(startedRideId);

            // Step 2: Delete participant_location rows (FK references started_rides.id)
            startedRideRepository.deleteParticipantLocationsByStartedRideId(startedRideId);

            // Step 3: Delete started_ride_participants join table
            startedRideRepository.deleteParticipantsByStartedRideId(startedRideId);

            // Step 4: Delete the started_ride itself
            startedRideRepository.delete(startedRide);
            startedRideRepository.flush();
        });

        ride.setActive(false);
        AppLogger.info(this.getClass(), "Ride deactivated successfully", "generatedRidesId", generatedRidesId);
        ridesRepository.save(ride);
    }}