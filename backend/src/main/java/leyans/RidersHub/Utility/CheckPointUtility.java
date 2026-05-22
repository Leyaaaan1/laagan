package leyans.RidersHub.Utility;

import leyans.RidersHub.ExceptionHandler.RideAuthorizationException;
import leyans.RidersHub.Repository.StartedRideRepository;
import leyans.RidersHub.Service.LocationService;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.StartedRide;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;


@Service
public class CheckPointUtility {

    public static final double ARRIVAL_THRESHOLD_METERS = 50.0;
    private final StartedRideRepository startedRideRepository;
    private final LocationService locationService;

    public CheckPointUtility(StartedRideRepository startedRideRepository, LocationService locationService) {
        this.startedRideRepository = startedRideRepository;
        this.locationService = locationService;
    }

    public StartedRide getActiveStartedRide(String generatedRidesId) {
        return startedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No active ride found for: " + generatedRidesId));
    }

    public void validateRiderIsParticipant(StartedRide startedRide, Rider rider) {
        boolean isParticipant = startedRide.getParticipants()
                .stream()
                .anyMatch(p -> p.getUsername().equals(rider.getUsername()));

        if (!isParticipant) {
            throw new RideAuthorizationException("You are not a participant of this ride");
        }
    }

    /**
     * Validates the rider is within ARRIVAL_THRESHOLD_METERS of the checkpoint.
     * Uses LocationService.calculateDistance which calls PostGIS ST_Distance.
     */
    public void validateProximity(Point riderPoint, Point checkpointPoint, String checkpointName) {
        // calculateDistance returns km — convert to meters for comparison
        int distanceKm = locationService.calculateDistance(riderPoint, checkpointPoint);
        double distanceMeters = distanceKm * 1000.0;

        AppLogger.info(this.getClass(), "Proximity check",
                "checkpoint", checkpointName,
                "distanceMeters", distanceMeters,
                "thresholdMeters", ARRIVAL_THRESHOLD_METERS);

        if (distanceMeters > ARRIVAL_THRESHOLD_METERS) {
            throw new IllegalStateException(
                    "You are too far from " + checkpointName + ". " +
                            "Distance: " + (int) distanceMeters + "m. " +
                            "Required: within " + (int) ARRIVAL_THRESHOLD_METERS + "m."
            );
        }
    }
}
