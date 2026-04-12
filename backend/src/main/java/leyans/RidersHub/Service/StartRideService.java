package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Response.StartRideResponseDTO;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Repository.StartedRideRepository;
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
import java.util.List;

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
        Rider initiator = startedUtil.authenticateAndGetInitiator();
        Rides ride = ridesUtil.validateAndGetRide(generatedRidesId, initiator);

        // ✅ FIXED: Only the ride creator (owner) can start the ride
        boolean isCreator = ride.getUsername().getUsername().equals(initiator.getUsername());

        if (!isCreator) {
            throw new AccessDeniedException("Only the ride creator can start the ride");
        }

        Point startingPoint = ride.getStartingLocation();
        if (startingPoint == null) {
            throw new RuntimeException("Ride does not have a valid starting location");
        }

        StartedRide startedRide = new StartedRide();
        startedRide.setRide(ride);
        startedRide.setUsername(initiator);
        startedRide.setStartTime(LocalDateTime.now());
        startedRide.setLocation(startingPoint);

        List<Rider> allParticipants = new ArrayList<>(ride.getParticipants());
        boolean creatorAlreadyIncluded = allParticipants.stream()
                .anyMatch(p -> p.getUsername().equals(ride.getUsername().getUsername()));
        if (!creatorAlreadyIncluded) {
            allParticipants.add(ride.getUsername());
        }

        startedRide.setParticipants(allParticipants);
        startedRide = startedRideRepository.save(startedRide);

        ride.setActive(true);
        ridesRepository.save(ride);

        List<ParticipantLocation> participantLocations = startedUtil.initializeParticipantLocations(
                startedRide,
                allParticipants,
                startingPoint
        );

        return startedUtil.buildStartRideResponse(startedRide, ride, participantLocations);
    }



    @Transactional
    public void deactivateRide(String generatedRidesId) {
        // 1. Find the ride — generatedRidesId is NOT the PK, so use findByGeneratedRidesId
        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found: " + generatedRidesId));

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
        ridesRepository.save(ride);
    }}