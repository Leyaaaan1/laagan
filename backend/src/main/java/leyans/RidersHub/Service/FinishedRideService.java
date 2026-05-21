package leyans.RidersHub.Service;

import jakarta.persistence.EntityNotFoundException;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.ExceptionHandler.RideAuthorizationException;
import leyans.RidersHub.Repository.*;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.CheckPointUtility;
import leyans.RidersHub.Utility.StartedUtil;
import leyans.RidersHub.model.*;
import leyans.RidersHub.model.participant.ParticipantLocation;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class FinishedRideService {

    private final StartedRideRepository startedRideRepository;
    private final RidesRepository ridesRepository;
    private final FinishedRideRepository finishedRideRepository;
    private final StartedUtil startedUtil;

    private final RiderLocationRepository locationRepo;


    private final RideCheckpointArrivalRepository rideCheckpointArrivalRepository;

    private final CheckPointUtility checkPointUtility;

    public FinishedRideService(StartedRideRepository startedRideRepository,
                               RidesRepository ridesRepository,
                               FinishedRideRepository finishedRideRepository,
                               StartedUtil startedUtil, RiderLocationRepository locationRepo, RideCheckpointArrivalRepository rideCheckpointArrivalRepository, CheckPointUtility checkPointUtility) {
        this.startedRideRepository = startedRideRepository;
        this.ridesRepository = ridesRepository;
        this.finishedRideRepository = finishedRideRepository;
        this.startedUtil = startedUtil;
        this.locationRepo = locationRepo;
        this.rideCheckpointArrivalRepository = rideCheckpointArrivalRepository;
        this.checkPointUtility = checkPointUtility;
    }

    /**
     * Only the ride creator can call this.
     * Saves a FinishedRide record and sets ride.active = false.
     */

    @Transactional
    public FinishedRide finishRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "finishRide called", "generatedRidesId", generatedRidesId);

        Rider requester = startedUtil.authenticateAndGetInitiator();

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found: " + generatedRidesId));

        // Only the creator can finish
        boolean isCreator = ride.getUsername().getUsername().equals(requester.getUsername());
        if (!isCreator) {
            AppLogger.warn(this.getClass(), "Unauthorized finish attempt",
                    "requester", requester.getUsername(), "rideId", generatedRidesId);
            throw new RideAuthorizationException("Only the ride creator can finish the ride");
        }

        // Guard: ride must be active
        if (!Boolean.TRUE.equals(ride.getActive())) {
            throw new IllegalStateException("Ride is not currently active");
        }

        // Guard: already finished
        if (finishedRideRepository.existsByRideGeneratedRidesId(generatedRidesId)) {
            throw new IllegalStateException("Ride has already been finished");
        }

        StartedRide startedRide = startedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalStateException("StartedRide record missing for: " + generatedRidesId));

        LocalDateTime endTime = LocalDateTime.now();
        int durationMinutes = (int) ChronoUnit.MINUTES.between(startedRide.getStartTime(), endTime);

        // ✅ FIXED: Pass startedRide as first parameter
        FinishedRide finishedRide = new FinishedRide(
                startedRide,
                ride,
                requester,
                startedRide.getStartTime(),
                endTime,
                durationMinutes,
                startedRide.getParticipants()
        );

        FinishedRide saved = finishedRideRepository.save(finishedRide);

        ride.setActive(false);
        ridesRepository.save(ride);

        AppLogger.info(this.getClass(), "Ride finished successfully",
                "generatedRidesId", generatedRidesId,
                "durationMinutes", durationMinutes);

        return saved;
    }

    public void autoMarkCheckpoints(StartedRide startedRide, Rider rider, Point riderPoint) {
        Rides ride = startedRide.getRide();
        if (ride == null) return;

        // ── Check stop points ────────────────────────────────────────────────
        List<StopPoint> stopPoints = ride.getStopPoints();
        for (int i = 0; i < stopPoints.size(); i++) {
            StopPoint stop = stopPoints.get(i);
            Point stopLocation = stop.getStopLocation();
            if (stopLocation == null) continue;

            // Skip if already marked
            boolean alreadyMarked = rideCheckpointArrivalRepository
                    .existsByStartedRideIdAndRiderUsernameAndCheckpointTypeAndCheckpointIndex(
                            startedRide.getId(),
                            rider.getUsername(),
                            RideCheckpointArrival.CheckpointType.STOP_POINT,
                            i
                    );
            if (alreadyMarked) continue;

            double distanceMeters = locationRepo.getDistanceBetweenPoints(riderPoint, stopLocation);
            if (distanceMeters <= checkPointUtility.ARRIVAL_THRESHOLD_METERS) {
                RideCheckpointArrival arrival = new RideCheckpointArrival(
                        startedRide,
                        rider,
                        RideCheckpointArrival.CheckpointType.STOP_POINT,
                        i,
                        LocalDateTime.now()
                );
                rideCheckpointArrivalRepository.save(arrival);
                AppLogger.info(this.getClass(), "Auto-marked stop point arrival",
                        "rider", rider.getUsername(),
                        "stopName", stop.getStopName(),
                        "stopIndex", i,
                        "distanceMeters", distanceMeters);
            }
        }

        // ── Check ending point ───────────────────────────────────────────────
        Point endingLocation = ride.getEndingLocation();
        if (endingLocation == null) return;

        boolean endingAlreadyMarked = rideCheckpointArrivalRepository
                .existsByStartedRideIdAndRiderUsernameAndCheckpointType(
                        startedRide.getId(),
                        rider.getUsername(),
                        RideCheckpointArrival.CheckpointType.ENDING
                );
        if (endingAlreadyMarked) return;

        double endingDistanceMeters = locationRepo.getDistanceBetweenPoints(riderPoint, endingLocation);
        if (endingDistanceMeters <= CheckPointUtility.ARRIVAL_THRESHOLD_METERS) {
            RideCheckpointArrival arrival = new RideCheckpointArrival(
                    startedRide,
                    rider,
                    RideCheckpointArrival.CheckpointType.ENDING,
                    null,
                    LocalDateTime.now()
            );
            rideCheckpointArrivalRepository.save(arrival);
            AppLogger.info(this.getClass(), "Auto-marked ending arrival",
                    "rider", rider.getUsername(),
                    "endingPoint", ride.getEndingPointName(),
                    "distanceMeters", endingDistanceMeters);
        }


    }






    public List<CheckpointArrivalResponse> getCheckpointArrivalsByRide(String generatedRidesId) {

        // ✨ FIXED: Get the ride first
        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Ride not found: " + generatedRidesId));

        // Get the started ride to check participants
        StartedRide startedRide = startedRideRepository.findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Started ride not found for: " + generatedRidesId));

        // Get current user
        Rider currentUser = startedUtil.authenticateAndGetInitiator();

        // Authorization check
        boolean isRideOwner = ride.getUsername().getUsername().equals(currentUser.getUsername());
        boolean isParticipant = startedRide.getParticipants().stream()
                .anyMatch(p -> p.getUsername().equals(currentUser.getUsername()));

        if (!isRideOwner && !isParticipant) {
            AppLogger.warn(this.getClass(), "Unauthorized checkpoint access attempt",
                    "user", currentUser.getUsername(),
                    "rideId", generatedRidesId);
            throw new RideAuthorizationException(
                    "You must be the ride owner or a participant to view checkpoint arrivals"
            );
        }

        List<RideCheckpointArrival> arrivals =
                rideCheckpointArrivalRepository.findByGeneratedRidesId(generatedRidesId);

        // Convert to DTOs
        return arrivals.stream()
                .map(CheckpointArrivalResponse::new)
                .toList();
    }

}