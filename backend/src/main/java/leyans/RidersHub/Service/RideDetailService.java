package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.PhotoDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.DetailDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.SpeedSegmentDTO;
import leyans.RidersHub.Repository.FinishedRidePhotoRepository;
import leyans.RidersHub.Repository.FinishedRideRepository;
import leyans.RidersHub.Repository.PersonalFinishedRideRepository;
import leyans.RidersHub.Repository.RideCheckpointArrivalRepository;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.RideCalculationUtils;
import leyans.RidersHub.Utility.StartedUtil;
import leyans.RidersHub.model.FinishedRide.PersonalFinishedRide;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.StopPoint;
import leyans.RidersHub.model.participant.RideCheckpointArrival;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class RideDetailService {

    private final RidesRepository ridesRepository;
    private final FinishedRideRepository finishedRideRepository;
    private final PersonalFinishedRideRepository personalFinishedRideRepository;
    private final RideCheckpointArrivalRepository rideCheckpointArrivalRepository;
    private final FinishedRidePhotoRepository finishedRidePhotoRepository;
    private final StartedUtil startedUtil;

    public RideDetailService(RidesRepository ridesRepository,
                             FinishedRideRepository finishedRideRepository,
                             PersonalFinishedRideRepository personalFinishedRideRepository,
                             RideCheckpointArrivalRepository rideCheckpointArrivalRepository,
                             FinishedRidePhotoRepository finishedRidePhotoRepository,
                             StartedUtil startedUtil) {
        this.ridesRepository = ridesRepository;
        this.finishedRideRepository = finishedRideRepository;
        this.personalFinishedRideRepository = personalFinishedRideRepository;
        this.rideCheckpointArrivalRepository = rideCheckpointArrivalRepository;
        this.finishedRidePhotoRepository = finishedRidePhotoRepository;
        this.startedUtil = startedUtil;
    }

    @Transactional(readOnly = true)
    public DetailDTO getRideDetail(String generatedRidesId) {
        AppLogger.info(this.getClass(), "getRideDetail called", "generatedRidesId", generatedRidesId);

        Rider requester = startedUtil.authenticateAndGetInitiator();

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found: " + generatedRidesId));

        // A detail/share view is valid once EITHER the requester personally
        // finished, OR the whole group ride has concluded. It should only be
        // rejected when neither has happened yet.
        boolean personallyFinished = personalFinishedRideRepository
                .existsByRideGeneratedRidesIdAndRiderUsername(generatedRidesId, requester.getUsername());
        boolean groupFinished = finishedRideRepository.existsByRideGeneratedRidesId(generatedRidesId);

        if (!personallyFinished && !groupFinished) {
            throw new IllegalArgumentException("Finished ride not found: " + generatedRidesId);
        }

        DetailDTO dto = new DetailDTO();
        dto.setGeneratedRidesId(ride.getGeneratedRidesId());
        dto.setRideName(ride.getRidesName());
        dto.setRouteCoordinates(ride.getRouteCoordinates());
        dto.setStartingPointName(ride.getStartingPointName());
        dto.setEndingPointName(ride.getEndingPointName());
        dto.setDistanceMeters(ride.getDistance());
        dto.setStopPoints(ride.getStopPoints().stream()
                .map(sp -> new StopPointDTO(sp.getStopName(), sp.getStopLocation().getX(), sp.getStopLocation().getY()))
                .toList());

        Optional<PersonalFinishedRide> personalOpt = personalFinishedRideRepository
                .findByRideGeneratedRidesIdAndRiderUsername(generatedRidesId, requester.getUsername());

        if (personalOpt.isPresent()) {
            PersonalFinishedRide personal = personalOpt.get();
            dto.setHasPersonalRecord(true);
            dto.setStartTime(personal.getStartTime());
            dto.setEndTime(personal.getEndTime());
            dto.setDurationMinutes(personal.getDurationMinutes());
            dto.setAverageSpeedKph(RideCalculationUtils.computeAverageSpeedKph(
                    ride.getDistance(), personal.getDurationMinutes()));

            List<RideCheckpointArrival> riderArrivals = rideCheckpointArrivalRepository
                    .findByRideGeneratedRidesId(generatedRidesId)
                    .stream()
                    .filter(a -> a.getRider().getUsername().equals(requester.getUsername()))
                    .toList();

            dto.setSpeedSegments(buildSpeedSegments(ride, riderArrivals));
        } else {
            dto.setHasPersonalRecord(false);
            dto.setSpeedSegments(List.of());
        }

        finishedRidePhotoRepository.findByGeneratedRidesIdOrderByUploadedAtAsc(generatedRidesId)
                .stream()
                .findFirst()
                .ifPresent(p -> dto.setPhoto(new PhotoDTO(
                        p.getId(), p.getImageUrl(), p.getCaption(),
                        p.getUploadedBy(), p.getUploadedAt().toString())));

        return dto;
    }
    /**
     * Turns this rider's checkpoint timestamps into consecutive splits
     * (Start → Stop 1 → Stop 2 → ... → End), each with its own
     * distance/duration/speed — the Strava "laps" equivalent.
     * Checkpoints the rider never reached are simply skipped, so the
     * splits always reflect what they actually did, not the ride template.
     */
    private List<SpeedSegmentDTO> buildSpeedSegments(Rides ride, List<RideCheckpointArrival> riderArrivals) {

        List<CheckpointGeo> canonicalOrder = buildCanonicalCheckpointOrder(ride);

        List<TimedCheckpoint> timeline = new ArrayList<>();
        for (CheckpointGeo cp : canonicalOrder) {
            riderArrivals.stream()
                    .filter(a -> a.getCheckpointType() == cp.type()
                            && Objects.equals(a.getCheckpointIndex(), cp.index()))
                    .findFirst()
                    .ifPresent(a -> timeline.add(new TimedCheckpoint(cp.label(), cp.lat(), cp.lng(), a.getArrivedAt())));
        }

        List<SpeedSegmentDTO> segments = new ArrayList<>();
        for (int i = 0; i < timeline.size() - 1; i++) {
            TimedCheckpoint from = timeline.get(i);
            TimedCheckpoint to = timeline.get(i + 1);

            double distanceMeters = RideCalculationUtils.haversineMeters(
                    from.lat(), from.lng(), to.lat(), to.lng());
            long durationMinutes = ChronoUnit.MINUTES.between(from.arrivedAt(), to.arrivedAt());
            Double speedKph = RideCalculationUtils.computeSegmentSpeedKph(distanceMeters, durationMinutes);

            segments.add(new SpeedSegmentDTO(
                    from.label(), to.label(),
                    Math.round(distanceMeters * 10.0) / 10.0,
                    durationMinutes,
                    speedKph));
        }
        return segments;
    }

    private List<CheckpointGeo> buildCanonicalCheckpointOrder(Rides ride) {
        List<CheckpointGeo> order = new ArrayList<>();

        Point start = ride.getStartingLocation();
        if (start == null) {
            throw new IllegalStateException("Finished ride is missing a starting location: " + ride.getGeneratedRidesId());
        }
        order.add(new CheckpointGeo(ride.getStartingPointName(), start.getY(), start.getX(),
                RideCheckpointArrival.CheckpointType.STARTING_POINT, null));

        List<StopPoint> stops = ride.getStopPoints();
        for (int i = 0; i < stops.size(); i++) {
            StopPoint stop = stops.get(i);
            Point loc = stop.getStopLocation();
            if (loc == null) continue;
            order.add(new CheckpointGeo(stop.getStopName(), loc.getY(), loc.getX(),
                    RideCheckpointArrival.CheckpointType.STOP_POINT, i));
        }

        Point end = ride.getEndingLocation();
        if (end == null) {
            throw new IllegalStateException("Finished ride is missing an ending location: " + ride.getGeneratedRidesId());
        }
        order.add(new CheckpointGeo(ride.getEndingPointName(), end.getY(), end.getX(),
                RideCheckpointArrival.CheckpointType.ENDING, null));

        return order;
    }

    private record CheckpointGeo(String label, double lat, double lng,
                                 RideCheckpointArrival.CheckpointType type, Integer index) {}

    private record TimedCheckpoint(String label, double lat, double lng, LocalDateTime arrivedAt) {}
}
