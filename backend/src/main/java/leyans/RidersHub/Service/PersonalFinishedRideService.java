package leyans.RidersHub.Service;

import jakarta.persistence.EntityNotFoundException;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.DTO.Response.FinishedDTO.PersonalFinishedRideDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.SpeedSegmentDTO;
import leyans.RidersHub.Repository.PersonalFinishedRideRepository;
import leyans.RidersHub.Repository.RideCheckpointArrivalRepository;
import leyans.RidersHub.Repository.StartedRideRepository;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.RideCalculationUtils;
import leyans.RidersHub.Utility.StartedUtil;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.StartedRide;
import leyans.RidersHub.model.FinishedRide.PersonalFinishedRide;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class PersonalFinishedRideService {

        private final PersonalFinishedRideRepository personalFinishedRideRepository;
        private final StartedUtil startedUtil;
        private final StartedRideRepository startedRideRepository;
        private final RideCheckpointArrivalRepository rideCheckpointArrivalRepository;

        public PersonalFinishedRideService(PersonalFinishedRideRepository personalFinishedRideRepository,
                        RideCheckpointArrivalRepository rideCheckpointArrivalRepository, // ← ADD THIS
                        StartedUtil startedUtil,
                        StartedRideRepository startedRideRepository) {
                this.personalFinishedRideRepository = personalFinishedRideRepository;
                this.rideCheckpointArrivalRepository = rideCheckpointArrivalRepository; // ← ADD THIS
                this.startedUtil = startedUtil;
                this.startedRideRepository = startedRideRepository;
        }

        // ── Read ──────────────────────────────────────────────────────────────────

        @Transactional(readOnly = true)
        public PersonalFinishedRideDTO getPersonalSummaryDTO(String generatedRidesId) {
                PersonalFinishedRide personalFinishedRide = getPersonalSummary(generatedRidesId);
                Rides ride = personalFinishedRide.getRide();
                String riderUsername = personalFinishedRide.getRider().getUsername();

                // Checkpoint arrivals filtered to this rider only
                List<CheckpointArrivalResponse> checkpointArrivals = rideCheckpointArrivalRepository
                                .findByRideGeneratedRidesId(generatedRidesId)
                                .stream()
                                .filter(arrival -> arrival.getRider().getUsername().equals(riderUsername))
                                .map(CheckpointArrivalResponse::new)
                                .toList();

                // ── place this right after checkpointArrivals is built ──────────────────
                // Re-use the raw arrivals (before mapping to response DTOs) to build segments
                List<leyans.RidersHub.model.participant.RideCheckpointArrival> rawArrivals = rideCheckpointArrivalRepository
                                .findByRideGeneratedRidesId(generatedRidesId)
                                .stream()
                                .filter(a -> a.getRider().getUsername().equals(riderUsername))
                                .toList(); // already filtered above — extract to a variable instead

                List<SpeedSegmentDTO> speedSegments = buildSpeedSegments(rawArrivals, ride);

                // Stop points
                List<StopPointDTO> stopPointDTOs = ride.getStopPoints() != null
                                ? ride.getStopPoints().stream()
                                                .map(sp -> new StopPointDTO(
                                                                sp.getStopName(),
                                                                sp.getStopLocation().getX(),
                                                                sp.getStopLocation().getY()))
                                                .toList()
                                : new ArrayList<>();

                // Average speed is computed once at write-time (createPersonalSummaryOnArrival)
                // and stored on the entity — read it directly instead of recomputing.
                Double personalAverageSpeedKph = personalFinishedRide.getAverageSpeedKph();

                PersonalFinishedRideDTO dto = new PersonalFinishedRideDTO(
                                personalFinishedRide.getId(),
                                riderUsername,
                                generatedRidesId,
                                personalFinishedRide.getStartTime(),
                                personalFinishedRide.getEndTime(),
                                personalFinishedRide.getDurationMinutes(),
                                personalFinishedRide.getCreatedAt(),
                                checkpointArrivals,
                                stopPointDTOs,
                                ride.getStartingPointName(),
                                ride.getEndingPointName(),
                                ride.getDistance(), // NEW field — distanceMeters
                                personalAverageSpeedKph,
                                speedSegments);

                return dto;
        }

        // ── Write — called when a rider records an ENDING checkpoint arrival ──────
        //
        // Call this from your checkpoint-arrival handler right after you persist
        // the RideCheckpointArrival with type == ENDING.
        //
        // It is idempotent: if the record already exists it does nothing, so it is
        // safe to call it even if a rider somehow triggers the ending checkpoint twice.

        @Transactional(readOnly = true)
        public PersonalFinishedRide getPersonalSummary(String generatedRidesId) {
                Rider currentUser = startedUtil.authenticateAndGetInitiator();
                return personalFinishedRideRepository
                                .findByRideGeneratedRidesIdAndRiderUsername(
                                                generatedRidesId, currentUser.getUsername())
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "No personal summary found for rider: " + currentUser.getUsername()));
        }

        // =========================================================================
        // WRITE — called when a rider records an ENDING checkpoint arrival
        // Idempotent: safe to call twice.
        // =========================================================================
        @Transactional
        public void createPersonalSummaryOnArrival(Rider rider,
                        Rides ride,
                        LocalDateTime endTime) {
                String generatedRidesId = ride.getGeneratedRidesId();
                String username = rider.getUsername();

                if (personalFinishedRideRepository
                                .existsByRideGeneratedRidesIdAndRiderUsername(generatedRidesId, username)) {
                        return;
                }

                StartedRide startedRide = startedRideRepository
                                .findByRideGeneratedRidesId(generatedRidesId)
                                .orElseThrow(() -> new IllegalStateException(
                                                "StartedRide not found for ride: " + generatedRidesId));

                LocalDateTime startTime = startedRide.getStartTime();
                int durationMinutes = (int) ChronoUnit.MINUTES.between(startTime, endTime);

                // Compute once here, at write-time, since distance and durationMinutes are
                // both fixed facts by now — store it so reads never need to recompute.
                Double averageSpeedKph = RideCalculationUtils.computeAverageSpeedKph(
                                ride.getDistance(), durationMinutes);

                PersonalFinishedRide record = new PersonalFinishedRide(
                                ride, rider, startTime, endTime, durationMinutes, null, averageSpeedKph);

                personalFinishedRideRepository.save(record);
        }

        // Add import at top of file:
        // import leyans.RidersHub.DTO.Response.FinishedDTO.SpeedSegmentDTO;
        // import leyans.RidersHub.model.participant.RideCheckpointArrival;
        // import java.util.Comparator;

        private List<SpeedSegmentDTO> buildSpeedSegments(
                        List<leyans.RidersHub.model.participant.RideCheckpointArrival> arrivals,
                        Rides ride) {

                if (arrivals == null || arrivals.size() < 2)
                        return new ArrayList<>();

                Integer totalDistanceMeters = ride.getDistance();

                List<leyans.RidersHub.model.participant.RideCheckpointArrival> sorted = arrivals.stream()
                                .sorted(Comparator.comparing(
                                                leyans.RidersHub.model.participant.RideCheckpointArrival::getArrivedAt))
                                .toList();

                int numLegs = sorted.size() - 1;
                double legDistanceMeters = totalDistanceMeters != null
                                ? (double) totalDistanceMeters / numLegs
                                : 0;

                List<SpeedSegmentDTO> segments = new ArrayList<>();
                for (int i = 0; i < numLegs; i++) {
                        var from = sorted.get(i);
                        var to = sorted.get(i + 1);

                        long durationMins = ChronoUnit.MINUTES.between(
                                        from.getArrivedAt(), to.getArrivedAt());

                        double avgKph = durationMins > 0
                                        ? (legDistanceMeters / 1000.0) / (durationMins / 60.0)
                                        : 0;

                        double roundedKph = Math.round(avgKph * 10.0) / 10.0;

                        segments.add(new SpeedSegmentDTO(
                                        resolveCheckpointLabel(from, ride),
                                        resolveCheckpointLabel(to, ride),
                                        legDistanceMeters,
                                        durationMins,
                                        roundedKph));
                }
                return segments;
        }

        private String resolveCheckpointLabel(
                        leyans.RidersHub.model.participant.RideCheckpointArrival arrival,
                        Rides ride) {

                return switch (arrival.getCheckpointType()) {
                        case STARTING_POINT -> ride.getStartingPointName();
                        case ENDING -> ride.getEndingPointName();
                        case STOP_POINT -> {
                                Integer idx = arrival.getCheckpointIndex();
                                yield (ride.getStopPoints() != null && idx != null && idx < ride.getStopPoints().size())
                                                ? ride.getStopPoints().get(idx).getStopName()
                                                : "Stop " + (idx == null ? "?" : idx + 1);
                        }
                };
        }

}