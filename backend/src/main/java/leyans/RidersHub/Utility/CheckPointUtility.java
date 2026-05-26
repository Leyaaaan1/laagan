package leyans.RidersHub.Utility;

import jakarta.persistence.EntityNotFoundException;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.ExceptionHandler.RideAuthorizationException;
import leyans.RidersHub.Repository.RideCheckpointArrivalRepository;
import leyans.RidersHub.Repository.RiderLocationRepository;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.model.*;
import leyans.RidersHub.model.participant.RideCheckpointArrival;
import leyans.RidersHub.model.FinishedRide.PersonalFinishedRide;
import leyans.RidersHub.Repository.PersonalFinishedRideRepository;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;


@Service
public class CheckPointUtility {

    public static final double ARRIVAL_THRESHOLD_METERS = 50.0;

    private final RideCheckpointArrivalRepository rideCheckpointArrivalRepository;
    private final RidesRepository ridesRepository;
    private final RiderLocationRepository locationRepo;
    private final StartedUtil startedUtil;
    private final PersonalFinishedRideRepository personalFinishedRideRepository;

    public CheckPointUtility(RideCheckpointArrivalRepository rideCheckpointArrivalRepository, RidesRepository ridesRepository, RiderLocationRepository locationRepo, StartedUtil startedUtil, PersonalFinishedRideRepository personalFinishedRideRepository) {
        this.rideCheckpointArrivalRepository = rideCheckpointArrivalRepository;
        this.ridesRepository = ridesRepository;
        this.locationRepo = locationRepo;
        this.startedUtil = startedUtil;
        this.personalFinishedRideRepository = personalFinishedRideRepository;
    }


    public void autoMarkCheckpoints(StartedRide startedRide, Rider rider, Point riderPoint) {
        Rides ride = startedRide.getRide();
        if (ride == null) return;

        List<StopPoint> stopPoints = ride.getStopPoints();
        for (int i = 0; i < stopPoints.size(); i++) {
            StopPoint stop = stopPoints.get(i);
            Point stopLocation = stop.getStopLocation();
            if (stopLocation == null) continue;

            boolean alreadyMarked = rideCheckpointArrivalRepository
                    .existsByRideGeneratedRidesIdAndRiderUsernameAndCheckpointTypeAndCheckpointIndex(
                            ride.getGeneratedRidesId(),
                            rider.getUsername(),
                            RideCheckpointArrival.CheckpointType.STOP_POINT,
                            i
                    );
            if (alreadyMarked) continue;

            double distanceMeters = locationRepo.getDistanceBetweenPoints(riderPoint, stopLocation);
            if (distanceMeters <= ARRIVAL_THRESHOLD_METERS) {
                RideCheckpointArrival arrival = new RideCheckpointArrival(
                        ride,
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

        Point endingLocation = ride.getEndingLocation();
        if (endingLocation == null) return;

        boolean endingAlreadyMarked = rideCheckpointArrivalRepository
                .existsByRideGeneratedRidesIdAndRiderUsernameAndCheckpointType(
                        ride.getGeneratedRidesId(),
                        rider.getUsername(),
                        RideCheckpointArrival.CheckpointType.ENDING
                );
        if (endingAlreadyMarked) return;

        double endingDistanceMeters = locationRepo.getDistanceBetweenPoints(riderPoint, endingLocation);
        if (endingDistanceMeters <= CheckPointUtility.ARRIVAL_THRESHOLD_METERS) {
            LocalDateTime endTime = LocalDateTime.now();

            RideCheckpointArrival arrival = new RideCheckpointArrival(
                    ride,
                    rider,
                    RideCheckpointArrival.CheckpointType.ENDING,
                    null,
                    endTime
            );
            rideCheckpointArrivalRepository.save(arrival);

            // Save PersonalFinishedRide immediately when this rider reaches the ending —
            // independent of whether the creator has ended the group ride yet
            if (!personalFinishedRideRepository.existsByRideGeneratedRidesIdAndRiderUsername(
                    ride.getGeneratedRidesId(), rider.getUsername())) {

                int durationMinutes = (int) java.time.temporal.ChronoUnit.MINUTES.between(
                        startedRide.getStartTime(), endTime);

                PersonalFinishedRide personal = new PersonalFinishedRide(
                        ride,
                        rider,
                        startedRide.getStartTime(),
                        endTime,
                        durationMinutes
                );
                personalFinishedRideRepository.save(personal);
                AppLogger.info(this.getClass(), "PersonalFinishedRide saved",
                        "rider", rider.getUsername(),
                        "generatedRidesId", ride.getGeneratedRidesId(),
                        "durationMinutes", durationMinutes);
            }

            AppLogger.info(this.getClass(), "Auto-marked ending arrival",
                    "rider", rider.getUsername(),
                    "endingPoint", ride.getEndingPointName(),
                    "distanceMeters", endingDistanceMeters);
        }
    }

    public List<CheckpointArrivalResponse> getCheckpointArrivalsByRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "getCheckpointArrivalsByRide called", "generatedRidesId", generatedRidesId);

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Ride not found: " + generatedRidesId));

        Rider currentUser = startedUtil.authenticateAndGetInitiator();

        boolean isRideOwner = ride.getUsername().getUsername().equals(currentUser.getUsername());

        // Check participation via Rides.participants (permanent record)
        boolean isParticipant = ride.getParticipants().stream()
                .anyMatch(p -> p.getUsername().equals(currentUser.getUsername()));

        if (!isRideOwner && !isParticipant) {
            AppLogger.warn(this.getClass(), "Unauthorized checkpoint access attempt",
                    "user", currentUser.getUsername(),
                    "rideId", generatedRidesId);
            throw new RideAuthorizationException(
                    "You must be the ride owner or a participant to view checkpoint arrivals");
        }

        return rideCheckpointArrivalRepository.findByRideGeneratedRidesId(generatedRidesId).stream()
                .map(CheckpointArrivalResponse::new)
                .toList();
    }
}