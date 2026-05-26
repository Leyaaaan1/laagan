package leyans.RidersHub.Utility;


import jakarta.persistence.EntityNotFoundException;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.DTO.Response.FinishedDTO.FinishedRideResponseDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.ParticipantStatisticsDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.ParticipantSummaryDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.RideCompletionStatusDTO;
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

    public FinishedRideUtility(RideCheckpointArrivalRepository rideCheckpointArrivalRepository, FinishedRideRepository finishedRideRepository, RidesRepository ridesRepository, StartedRideRepository startedRideRepository) {
        this.rideCheckpointArrivalRepository = rideCheckpointArrivalRepository;
        this.finishedRideRepository = finishedRideRepository;
        this.ridesRepository = ridesRepository;
        this.startedRideRepository = startedRideRepository;
    }


    public FinishedRideResponseDTO buildAndSaveFinishedRide(
            StartedRide startedRide,
            Rides ride,
            Rider finishedBy,
            String generatedRidesId) {

        // Snapshot participants and startTime before deleting StartedRide
        java.util.Set<Rider> participants = new java.util.HashSet<>(startedRide.getParticipants());
        LocalDateTime startTime = startedRide.getStartTime();

        // Use the latest ENDING arrival as end time, or now if none exist
        LocalDateTime endTime = rideCheckpointArrivalRepository
                .findByRideGeneratedRidesIdAndCheckpointType(
                        generatedRidesId,
                        RideCheckpointArrival.CheckpointType.ENDING)
                .stream()
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

        // Build response DTO
        FinishedRideResponseDTO response = new FinishedRideResponseDTO(saved);

        List<ParticipantSummaryDTO> participantSummaries = participants.stream()
                .map(rider -> {
                    int totalCheckpoints = 1 + (ride.getStopPoints() != null ? ride.getStopPoints().size() : 0) + 1;
                    int checkpointsReached = countCheckpointsForRider(generatedRidesId, rider.getUsername());
                    return new ParticipantSummaryDTO(rider.getUsername(), checkpointsReached, totalCheckpoints);
                })
                .toList();
        response.setCompletedParticipants(participantSummaries);

        List<ParticipantStatisticsDTO> stats = buildParticipantStatistics(
                generatedRidesId,
                participants,
                ride
        );
        response.setParticipantStats(stats);

        List<CheckpointArrivalResponse> arrivals = rideCheckpointArrivalRepository
                .findByRideGeneratedRidesId(generatedRidesId).stream()
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
        // Force-initialize the lazy collection inside the transaction
        java.util.Set<Rider> participants = finishedRide.getCompletedParticipants();
        Hibernate.initialize(participants);

        FinishedRideResponseDTO response = new FinishedRideResponseDTO(finishedRide);

        List<ParticipantSummaryDTO> participantSummaries = participants.stream()
                .map(rider -> {
                    int totalCheckpoints = 1 + (ride.getStopPoints() != null ? ride.getStopPoints().size() : 0) + 1;
                    int checkpointsReached = countCheckpointsForRider(generatedRidesId, rider.getUsername());
                    return new ParticipantSummaryDTO(rider.getUsername(), checkpointsReached, totalCheckpoints);
                })
                .toList();
        response.setCompletedParticipants(participantSummaries);

        List<ParticipantStatisticsDTO> stats = buildParticipantStatistics(
                generatedRidesId,
                participants,
                ride
        );
        response.setParticipantStats(stats);

        List<CheckpointArrivalResponse> arrivals = rideCheckpointArrivalRepository
                .findByRideGeneratedRidesId(generatedRidesId).stream()
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

        // Ride is still active — count via generatedRidesId directly
        long totalParticipants = rideCheckpointArrivalRepository
                .countDistinctRidersByGeneratedRidesId(generatedRidesId);
        long participantsAtEnding = rideCheckpointArrivalRepository
                .countByRideGeneratedRidesIdAndCheckpointType(
                        generatedRidesId,
                        RideCheckpointArrival.CheckpointType.ENDING);

        boolean isComplete = totalParticipants > 0 && participantsAtEnding >= totalParticipants;

        AppLogger.info(this.getClass(), "Completion status retrieved",
                "total", totalParticipants, "arrived", participantsAtEnding, "complete", isComplete);

        return new RideCompletionStatusDTO(
                (int) totalParticipants,
                (int) participantsAtEnding,
                isComplete,
                ride.getActive()
        );
    }



    private List<ParticipantStatisticsDTO> buildParticipantStatistics(
            String generatedRidesId,
            java.util.Set<Rider> participants,
            Rides ride) {

        List<RideCheckpointArrival> allArrivals = rideCheckpointArrivalRepository.findByRideGeneratedRidesId(generatedRidesId);
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

    private int countCheckpointsForRider(String generatedRidesId, String riderUsername) {
        int count = 0;
        count++; // start point always counts

        List<RideCheckpointArrival> arrivals = rideCheckpointArrivalRepository.findByRideGeneratedRidesId(generatedRidesId);
        count += (int) arrivals.stream()
                .filter(a -> a.getRider().getUsername().equals(riderUsername))
                .count();

        return count;
    }

}
