package leyans.RidersHub.Utility;


import jakarta.persistence.EntityNotFoundException;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.DTO.Response.FinishedDTO.FinishedRideResponseDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.ParticipantStatisticsDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.ParticipantSummaryDTO;
import leyans.RidersHub.Repository.FinishedRideRepository;
import leyans.RidersHub.Repository.RideCheckpointArrivalRepository;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Repository.StartedRideRepository;
import leyans.RidersHub.model.*;
import leyans.RidersHub.model.FinishedRide.FinishedRide;
import leyans.RidersHub.model.participant.RideCheckpointArrival;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Service
public class FinishedRideUtility {

    private final RideCheckpointArrivalRepository rideCheckpointArrivalRepository;
    private final FinishedRideRepository finishedRideRepository;
    private final RidesRepository ridesRepository;
    private final StartedRideRepository startedRideRepository;

    public FinishedRideUtility(RideCheckpointArrivalRepository rideCheckpointArrivalRepository,
                               FinishedRideRepository finishedRideRepository,
                               RidesRepository ridesRepository,
                               StartedRideRepository startedRideRepository) {
        this.rideCheckpointArrivalRepository = rideCheckpointArrivalRepository;
        this.finishedRideRepository = finishedRideRepository;
        this.ridesRepository = ridesRepository;
        this.startedRideRepository = startedRideRepository;
    }


    // =========================================================================
    // BUILD AND SAVE FINISHED RIDE
    // =========================================================================
    public FinishedRideResponseDTO buildAndSaveFinishedRide(
            StartedRide startedRide,
            Rides ride,
            Rider finishedBy,
            String generatedRidesId) {

        // Snapshot participants and startTime before deleting StartedRide
        java.util.Set<Rider> participants = new java.util.HashSet<>(startedRide.getParticipants());
        LocalDateTime startTime = startedRide.getStartTime();

        // FIX: Fetch ALL arrivals once — reused for endTime, summaries, stats, and response
        List<RideCheckpointArrival> allArrivals =
                rideCheckpointArrivalRepository.findByRideGeneratedRidesId(generatedRidesId);

        // Use the latest ENDING arrival as end time, or now if none exist
        LocalDateTime endTime = allArrivals.stream()
                .filter(a -> a.getCheckpointType() == RideCheckpointArrival.CheckpointType.ENDING)
                .map(RideCheckpointArrival::getArrivedAt)
                .max(Comparator.naturalOrder())
                .orElse(LocalDateTime.now());

        int durationMinutes = (int) ChronoUnit.MINUTES.between(startTime, endTime);

        FinishedRide finishedRide = new FinishedRide(
                ride,
                finishedBy,
                startTime,
                endTime,
                durationMinutes,
                participants
        );

        FinishedRide saved = finishedRideRepository.save(finishedRide);

        ride.setActive(false);
        ridesRepository.save(ride);

        // Delete StartedRide — safe now that checkpoint arrivals and
        // FinishedRide both reference Rides, not StartedRide
        startedRideRepository.delete(startedRide);

        AppLogger.info(this.getClass(), "Ride finished and StartedRide cleaned up",
                "generatedRidesId", generatedRidesId,
                "durationMinutes", durationMinutes);

        // Build response DTO — all using the already-fetched allArrivals, no extra DB calls
        FinishedRideResponseDTO response = new FinishedRideResponseDTO(saved);

        int totalCheckpoints = 1 + (ride.getStopPoints() != null ? ride.getStopPoints().size() : 0) + 1;

        List<ParticipantSummaryDTO> participantSummaries = participants.stream()
                .map(rider -> {
                    int checkpointsReached = countCheckpointsForRider(allArrivals, rider.getUsername());
                    return new ParticipantSummaryDTO(rider.getUsername(), checkpointsReached, totalCheckpoints);
                })
                .toList();
        response.setCompletedParticipants(participantSummaries);

        List<ParticipantStatisticsDTO> stats = buildParticipantStatistics(allArrivals, participants, ride);
        response.setParticipantStats(stats);

        List<CheckpointArrivalResponse> arrivals = allArrivals.stream()
                .map(CheckpointArrivalResponse::new)
                .toList();
        response.setCheckpointArrivals(arrivals);

        return response;
    }


    // =========================================================================
    // GET FINISHED RIDE SUMMARY
    // =========================================================================
    @Transactional(readOnly = true)
    public FinishedRideResponseDTO getFinishedRideSummary(String generatedRidesId) {
        FinishedRide finishedRide = finishedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Finished ride not found: " + generatedRidesId));

        Rides ride = finishedRide.getRide();

        // Force-initialize the lazy collection inside the transaction
        java.util.Set<Rider> participants = finishedRide.getCompletedParticipants();
        Hibernate.initialize(participants);

        // FIX: Fetch ALL arrivals once — reused for summaries, stats, and response
        List<RideCheckpointArrival> allArrivals =
                rideCheckpointArrivalRepository.findByRideGeneratedRidesId(generatedRidesId);

        FinishedRideResponseDTO response = new FinishedRideResponseDTO(finishedRide);

        int totalCheckpoints = 1 + (ride.getStopPoints() != null ? ride.getStopPoints().size() : 0) + 1;

        List<ParticipantSummaryDTO> participantSummaries = participants.stream()
                .map(rider -> {
                    int checkpointsReached = countCheckpointsForRider(allArrivals, rider.getUsername());
                    return new ParticipantSummaryDTO(rider.getUsername(), checkpointsReached, totalCheckpoints);
                })
                .toList();
        response.setCompletedParticipants(participantSummaries);

        List<ParticipantStatisticsDTO> stats = buildParticipantStatistics(allArrivals, participants, ride);
        response.setParticipantStats(stats);

        List<CheckpointArrivalResponse> arrivals = allArrivals.stream()
                .map(CheckpointArrivalResponse::new)
                .toList();
        response.setCheckpointArrivals(arrivals);

        return response;
    }


    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * FIX: Accepts pre-fetched arrivals instead of querying DB per rider.
     * Before: N DB calls (one per participant). After: 0 extra DB calls.
     */
    private int countCheckpointsForRider(List<RideCheckpointArrival> allArrivals, String riderUsername) {
        int count = 1; // start point always counts
        count += (int) allArrivals.stream()
                .filter(a -> a.getRider().getUsername().equals(riderUsername))
                .count();
        return count;
    }

    /**
     * FIX: Accepts pre-fetched arrivals instead of querying DB again.
     * Before: called findByRideGeneratedRidesId() internally (extra DB call).
     * After: reuses the list already fetched by the caller.
     */
    private List<ParticipantStatisticsDTO> buildParticipantStatistics(
            List<RideCheckpointArrival> allArrivals,
            java.util.Set<Rider> participants,
            Rides ride) {

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
}