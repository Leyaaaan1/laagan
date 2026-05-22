
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

    /**     * Finish ride when all participants reach the ending point.     * Individual riders mark themselves as done, but ride only completes when ALL arrive.     */

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

        // ✨ Check if requester is at ending point
        boolean requesterAtEnding = rideCheckpointArrivalRepository
                .existsByStartedRideIdAndRiderUsernameAndCheckpointType(
                        startedRide.getId(),
                        requester.getUsername(),
                        RideCheckpointArrival.CheckpointType.ENDING
                );

        if (!requesterAtEnding) {
            throw new IllegalStateException(
                    "You must reach the ending point before finishing the ride");
        }

        // ✨ Check if ALL participants have reached the ending point
        int totalParticipants = startedRide.getParticipants().size();
        long participantsAtEnding = rideCheckpointArrivalRepository
                .countByStartedRideIdAndCheckpointType(
                        startedRide.getId(),
                        RideCheckpointArrival.CheckpointType.ENDING);

        if (participantsAtEnding < totalParticipants) {
            int stillWaiting = (int) (totalParticipants - participantsAtEnding);
            throw new IllegalStateException(
                    "Waiting for " + stillWaiting + " participant(s) to reach the finish line"
            );
        }

        // ✨ All participants have arrived - finish the ride
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

        // ✨ BUILD COMPREHENSIVE RESPONSE
        FinishedRideResponseDTO response = new FinishedRideResponseDTO(saved);

        // Build participant summaries with checkpoint completion
        List<ParticipantSummaryDTO> participantSummaries = saved.getCompletedParticipants().stream()
                .map(rider -> {
                    int totalCheckpoints = 1 + (ride.getStopPoints() != null ? ride.getStopPoints().size() : 0) + 1;
                    int checkpointsReached = countCheckpointsForRider(startedRide.getId(), rider.getUsername());
                    return new ParticipantSummaryDTO(rider.getUsername(), checkpointsReached, totalCheckpoints);
                })
                .toList();
        response.setCompletedParticipants(participantSummaries);

        // Build detailed participant statistics
        List<ParticipantStatisticsDTO> stats = buildParticipantStatistics(
                startedRide.getId(),
                saved.getCompletedParticipants(),
                ride
        );
        response.setParticipantStats(stats);

        // Get all checkpoint arrivals for display
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
        StartedRide startedRide = startedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Started ride not found"));

        FinishedRideResponseDTO response = new FinishedRideResponseDTO(finishedRide);

        List<ParticipantSummaryDTO> participantSummaries = finishedRide.getCompletedParticipants().stream()
                .map(rider -> {
                    int totalCheckpoints = 1 + (ride.getStopPoints() != null ? ride.getStopPoints().size() : 0) + 1;
                    int checkpointsReached = countCheckpointsForRider(startedRide.getId(), rider.getUsername());
                    return new ParticipantSummaryDTO(rider.getUsername(), checkpointsReached, totalCheckpoints);
                })
                .toList();
        response.setCompletedParticipants(participantSummaries);

        List<CheckpointArrivalResponse> arrivals = rideCheckpointArrivalRepository
                .findByGeneratedRidesId(generatedRidesId).stream()
                .map(CheckpointArrivalResponse::new)
                .toList();
        response.setCheckpointArrivals(arrivals);

        return response;
    }
    /**     * Get ride completion status for frontend polling.     * Shows how many participants have reached the ending point.     */
    @Transactional(readOnly = true)
    public RideCompletionStatusDTO getRideCompletionStatus(String generatedRidesId) {
        AppLogger.info(this.getClass(), "getRideCompletionStatus called", "generatedRidesId", generatedRidesId);

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found: " + generatedRidesId));

        StartedRide startedRide = startedRideRepository.findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalStateException("Started ride not found"));

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

    /**     * Count checkpoints reached by a specific rider     */
    private int countCheckpointsForRider(Integer startedRideId, String riderUsername) {
        int count = 0;

        // Count start (always reached if participant)
        count++;

        // Count all checkpoint arrivals for this rider
        List<RideCheckpointArrival> arrivals = rideCheckpointArrivalRepository.findByStartedRideId(startedRideId);
        count += (int) arrivals.stream()
                .filter(a -> a.getRider().getUsername().equals(riderUsername))
                .count();

        return count;
    }

    /**     * Build detailed statistics for each participant     */
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
                            .filter(a -> a.getCheckpointType().toString().equals("ENDING"))
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

    /**     * Auto-mark checkpoints when rider reaches them     */
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

    /**     * Get checkpoint arrivals for a specific ride     */
    public List<CheckpointArrivalResponse> getCheckpointArrivalsByRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "getCheckpointArrivalsByRide called", "generatedRidesId", generatedRidesId);

        // Get the ride first
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