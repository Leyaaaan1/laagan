package leyans.RidersHub.Service;

import jakarta.persistence.EntityNotFoundException;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.DTO.Response.FinishedDTO.FinishedRideResponseDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.ParticipantStatisticsDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.ParticipantSummaryDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.RideCompletionStatusDTO;
import leyans.RidersHub.ExceptionHandler.RideAuthorizationException;
import leyans.RidersHub.Repository.*;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.CheckPointUtility;
import leyans.RidersHub.Utility.StartedUtil;
import leyans.RidersHub.model.*;
import org.locationtech.jts.geom.Point;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
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
                               StartedUtil startedUtil,
                               RiderLocationRepository locationRepo,
                               RideCheckpointArrivalRepository rideCheckpointArrivalRepository,
                               CheckPointUtility checkPointUtility) {
        this.startedRideRepository = startedRideRepository;
        this.ridesRepository = ridesRepository;
        this.finishedRideRepository = finishedRideRepository;
        this.startedUtil = startedUtil;
        this.locationRepo = locationRepo;
        this.rideCheckpointArrivalRepository = rideCheckpointArrivalRepository;
        this.checkPointUtility = checkPointUtility;
    }

    /**
     * Finish ride when ALL participants have reached the ending point.
     * Any participant can trigger this once everyone has arrived.
     */
    @Transactional
    public FinishedRideResponseDTO finishRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "finishRide called", "generatedRidesId", generatedRidesId);

        Rider requester = startedUtil.authenticateAndGetInitiator();

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found: " + generatedRidesId));

        if (!Boolean.TRUE.equals(ride.getActive())) {
            throw new IllegalStateException("Ride is not currently active");
        }

        if (finishedRideRepository.existsByRideGeneratedRidesId(generatedRidesId)) {
            throw new IllegalStateException("Ride has already been finished");
        }

        StartedRide startedRide = startedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalStateException("StartedRide record missing"));

        // Check if requester is at ending point
        boolean requesterAtEnding = rideCheckpointArrivalRepository
                .existsByStartedRideIdAndRiderUsernameAndCheckpointType(
                        startedRide.getId(),
                        requester.getUsername(),
                        RideCheckpointArrival.CheckpointType.ENDING
                );

        if (!requesterAtEnding) {
            throw new IllegalStateException("You must reach the ending point before finishing the ride");
        }

        // Check if ALL participants have reached the ending point
        int totalParticipants = startedRide.getParticipants().size();
        long participantsAtEnding = rideCheckpointArrivalRepository
                .countByStartedRideIdAndCheckpointType(
                        startedRide.getId(),
                        RideCheckpointArrival.CheckpointType.ENDING);

        if (participantsAtEnding < totalParticipants) {
            int stillWaiting = (int) (totalParticipants - participantsAtEnding);
            throw new IllegalStateException(
                    "Waiting for " + stillWaiting + " participant(s) to reach the finish line");
        }

        return buildAndSaveFinishedRide(startedRide, ride, requester, generatedRidesId);
    }

    /**
     * Force-finish a ride regardless of participant checkpoint status.
     * Only the ride creator can call this.
     */
    @Transactional
    public FinishedRideResponseDTO forceFinishRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "forceFinishRide called", "generatedRidesId", generatedRidesId);

        Rider requester = startedUtil.authenticateAndGetInitiator();

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found: " + generatedRidesId));

        // Only the ride creator can force-finish
        if (!ride.getUsername().getUsername().equals(requester.getUsername())) {
            throw new RideAuthorizationException("Only the ride creator can force-finish a ride");
        }

        if (!Boolean.TRUE.equals(ride.getActive())) {
            throw new IllegalStateException("Ride is not currently active");
        }

        if (finishedRideRepository.existsByRideGeneratedRidesId(generatedRidesId)) {
            throw new IllegalStateException("Ride has already been finished");
        }

        StartedRide startedRide = startedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalStateException("StartedRide record missing"));

        AppLogger.warn(this.getClass(), "Force-finishing ride by creator",
                "generatedRidesId", generatedRidesId,
                "creator", requester.getUsername());

        return buildAndSaveFinishedRide(startedRide, ride, requester, generatedRidesId);
    }

    /**
     * Shared logic: saves the FinishedRide, marks ride inactive,
     * and builds the response DTO.
     * StartedRide is intentionally kept so checkpoint arrivals and
     * summaries remain queryable after the ride ends.
     */
    private FinishedRideResponseDTO buildAndSaveFinishedRide(
            StartedRide startedRide,
            Rides ride,
            Rider finishedBy,
            String generatedRidesId) {

        // Use the latest ENDING arrival as end time, or now if none exist
        LocalDateTime endTime = rideCheckpointArrivalRepository
                .findByStartedRideIdAndCheckpointType(
                        startedRide.getId(),
                        RideCheckpointArrival.CheckpointType.ENDING)
                .stream()
                .map(RideCheckpointArrival::getArrivedAt)
                .max(Comparator.naturalOrder())
                .orElse(LocalDateTime.now());

        int durationMinutes = (int) ChronoUnit.MINUTES.between(startedRide.getStartTime(), endTime);

        FinishedRide finishedRide = new FinishedRide(
                startedRide,
                ride,
                finishedBy,
                startedRide.getStartTime(),
                endTime,
                durationMinutes,
                new java.util.HashSet<>(startedRide.getParticipants())
        );

        FinishedRide saved = finishedRideRepository.save(finishedRide);

        // Mark ride as inactive — keep StartedRide intact so checkpoint
        // arrivals and summaries remain queryable via its ID.
        ride.setActive(false);
        ridesRepository.save(ride);

        AppLogger.info(this.getClass(), "Ride finished successfully",
                "generatedRidesId", generatedRidesId,
                "durationMinutes", durationMinutes);

        // Copy into a new HashSet — do NOT pass startedRide.getParticipants() directly
        // into FinishedRide or use it as a shared reference. Hibernate will throw
        // "shared references to a collection" and roll back the whole transaction.
        java.util.Set<Rider> participants = new java.util.HashSet<>(startedRide.getParticipants());

        // Build response DTO
        FinishedRideResponseDTO response = new FinishedRideResponseDTO(saved);

        List<ParticipantSummaryDTO> participantSummaries = participants.stream()
                .map(rider -> {
                    int totalCheckpoints = 1 + (ride.getStopPoints() != null ? ride.getStopPoints().size() : 0) + 1;
                    int checkpointsReached = countCheckpointsForRider(startedRide.getId(), rider.getUsername());
                    return new ParticipantSummaryDTO(rider.getUsername(), checkpointsReached, totalCheckpoints);
                })
                .toList();
        response.setCompletedParticipants(participantSummaries);

        List<ParticipantStatisticsDTO> stats = buildParticipantStatistics(
                startedRide.getId(),
                participants,
                ride
        );
        response.setParticipantStats(stats);

        List<CheckpointArrivalResponse> arrivals = rideCheckpointArrivalRepository
                .findByGeneratedRidesId(generatedRidesId).stream()
                .map(CheckpointArrivalResponse::new)
                .toList();
        response.setCheckpointArrivals(arrivals);

        return response;
    }

    @Transactional(readOnly = true)
    public FinishedRideResponseDTO getFinishedRideSummary(String generatedRidesId) {
        FinishedRide finishedRide = finishedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Finished ride not found: " + generatedRidesId));

        Rides ride = finishedRide.getRide();
        // Retrieve StartedRide via the FK stored on FinishedRide — safe even
        // after the ride ends because we no longer delete StartedRide records.
        StartedRide startedRide = finishedRide.getStartedRide();

        // Force-initialize the lazy collection inside the transaction
        java.util.Set<Rider> participants = finishedRide.getCompletedParticipants();
        Hibernate.initialize(participants);

        FinishedRideResponseDTO response = new FinishedRideResponseDTO(finishedRide);

        List<ParticipantSummaryDTO> participantSummaries = participants.stream()
                .map(rider -> {
                    int totalCheckpoints = 1 + (ride.getStopPoints() != null ? ride.getStopPoints().size() : 0) + 1;
                    int checkpointsReached = countCheckpointsForRider(startedRide.getId(), rider.getUsername());
                    return new ParticipantSummaryDTO(rider.getUsername(), checkpointsReached, totalCheckpoints);
                })
                .toList();
        response.setCompletedParticipants(participantSummaries);

        List<ParticipantStatisticsDTO> stats = buildParticipantStatistics(
                startedRide.getId(),
                participants,
                ride
        );
        response.setParticipantStats(stats);

        List<CheckpointArrivalResponse> arrivals = rideCheckpointArrivalRepository
                .findByGeneratedRidesId(generatedRidesId).stream()
                .map(CheckpointArrivalResponse::new)
                .toList();
        response.setCheckpointArrivals(arrivals);

        return response;
    }

    @Transactional(readOnly = true)
    public RideCompletionStatusDTO getRideCompletionStatus(String generatedRidesId) {
        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Ride not found: " + generatedRidesId));

        // If the ride is already finished, derive status from FinishedRide
        java.util.Optional<FinishedRide> finishedOpt =
                finishedRideRepository.findByRideGeneratedRidesId(generatedRidesId);
        if (finishedOpt.isPresent()) {
            int total = finishedOpt.get().getCompletedParticipants().size();
            AppLogger.info(this.getClass(), "Completion status from FinishedRide (ride already done)",
                    "generatedRidesId", generatedRidesId);
            return new RideCompletionStatusDTO(total, total, true, false);
        }

        // Ride is still active — use StartedRide
        StartedRide startedRide = startedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Started ride not found: " + generatedRidesId));

        int totalParticipants = startedRide.getParticipants().size();
        long participantsAtEnding = rideCheckpointArrivalRepository
                .countByStartedRideIdAndCheckpointType(
                        startedRide.getId(),
                        RideCheckpointArrival.CheckpointType.ENDING);

        boolean isComplete = participantsAtEnding >= totalParticipants;

        AppLogger.info(this.getClass(), "Completion status retrieved",
                "total", totalParticipants, "arrived", participantsAtEnding, "complete", isComplete);

        return new RideCompletionStatusDTO(
                totalParticipants,
                (int) participantsAtEnding,
                isComplete,
                ride.getActive()
        );
    }

    private int countCheckpointsForRider(Integer startedRideId, String riderUsername) {
        int count = 0;
        count++; // start point always counts

        List<RideCheckpointArrival> arrivals = rideCheckpointArrivalRepository.findByStartedRideId(startedRideId);
        count += (int) arrivals.stream()
                .filter(a -> a.getRider().getUsername().equals(riderUsername))
                .count();

        return count;
    }

    private List<ParticipantStatisticsDTO> buildParticipantStatistics(
            Integer startedRideId,
            java.util.Set<Rider> participants,
            Rides ride) {

        List<RideCheckpointArrival> allArrivals = rideCheckpointArrivalRepository.findByStartedRideId(startedRideId);
        int totalCheckpoints = 2 + (ride.getStopPoints() != null ? ride.getStopPoints().size() : 0);

        return participants.stream()
                .map(rider -> {
                    List<RideCheckpointArrival> riderArrivals = allArrivals.stream()
                            .filter(a -> a.getRider().getUsername().equals(rider.getUsername()))
                            .toList();

                    LocalDateTime arrivalTime = riderArrivals.stream()
                            .filter(a -> a.getCheckpointType() == RideCheckpointArrival.CheckpointType.ENDING)
                            .map(RideCheckpointArrival::getArrivedAt)
                            .findFirst()
                            .orElse(null);

                    int checkpointsCompleted = riderArrivals.size();
                    String status = checkpointsCompleted == totalCheckpoints ? "COMPLETED"
                            : checkpointsCompleted > 0 ? "PARTIALLY_COMPLETED"
                              : "STARTED";

                    return new ParticipantStatisticsDTO(
                            rider.getUsername(),
                            arrivalTime,
                            checkpointsCompleted,
                            status
                    );
                })
                .toList();
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
        AppLogger.info(this.getClass(), "getCheckpointArrivalsByRide called", "generatedRidesId", generatedRidesId);

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Ride not found: " + generatedRidesId));

        Rider currentUser = startedUtil.authenticateAndGetInitiator();

        boolean isRideOwner = ride.getUsername().getUsername().equals(currentUser.getUsername());

        // For active rides, check the StartedRide participants table.
        // For finished rides, StartedRide still exists (we no longer delete it),
        // but we also accept participants stored on the FinishedRide record.
        boolean isParticipant = false;

        java.util.Optional<StartedRide> startedRideOpt =
                startedRideRepository.findByRideGeneratedRidesId(generatedRidesId);

        if (startedRideOpt.isPresent()) {
            isParticipant = startedRideOpt.get().getParticipants().stream()
                    .anyMatch(p -> p.getUsername().equals(currentUser.getUsername()));
        } else {
            // Fallback: check FinishedRide completedParticipants
            java.util.Optional<FinishedRide> finishedOpt =
                    finishedRideRepository.findByRideGeneratedRidesId(generatedRidesId);
            if (finishedOpt.isPresent()) {
                isParticipant = finishedOpt.get().getCompletedParticipants().stream()
                        .anyMatch(p -> p.getUsername().equals(currentUser.getUsername()));
            }
        }

        if (!isRideOwner && !isParticipant) {
            AppLogger.warn(this.getClass(), "Unauthorized checkpoint access attempt",
                    "user", currentUser.getUsername(),
                    "rideId", generatedRidesId);
            throw new RideAuthorizationException(
                    "You must be the ride owner or a participant to view checkpoint arrivals");
        }

        return rideCheckpointArrivalRepository.findByGeneratedRidesId(generatedRidesId).stream()
                .map(CheckpointArrivalResponse::new)
                .toList();
    }
}