package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.DTO.Response.RerouteResultDTO;
import leyans.RidersHub.Repository.RideCheckpointArrivalRepository;
import leyans.RidersHub.Service.MapService.RouteService;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.RouteDeviationCalculator;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.StopPoint;
import leyans.RidersHub.model.participant.RideCheckpointArrival;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Orchestrates per-rider route deviation detection and on-demand rerouting.
 *
 * State machine (per rider, per ride — stored in Redis):
 *
 * streak counter → how many consecutive pings have been "too far"
 * last-reroute ts → epoch-ms of the most recent successful reroute
 * active route → the rider's current personal route coordinates (JSON)
 *
 * All state expires automatically after {@code reroute.redis-state-ttl-hours}
 * so Redis never accumulates stale data from completed rides.
 */
@Service
public class RouteDeviationService {

    // ── Config ────────────────────────────────────────────────────────────────

    @Value("${reroute.deviation-threshold-meters:120}")
    private double deviationThresholdMeters;

    @Value("${reroute.confirmation-streak:2}")
    private int confirmationStreak;

    @Value("${reroute.cooldown-seconds:90}")
    private long cooldownSeconds;

    @Value("${reroute.redis-state-ttl-hours:6}")
    private long redisTtlHours;

    // ── Dependencies ─────────────────────────────────────────────────────────

    private final StringRedisTemplate redis;
    private final RouteDeviationCalculator calculator;
    private final RouteService routeService;
    private final RideCheckpointArrivalRepository checkpointRepo;

    public RouteDeviationService(StringRedisTemplate redis,
            RouteDeviationCalculator calculator,
            RouteService routeService,
            RideCheckpointArrivalRepository checkpointRepo) {
        this.redis = redis;
        this.calculator = calculator;
        this.routeService = routeService;
        this.checkpointRepo = checkpointRepo;
    }

    // ── Redis key helpers ─────────────────────────────────────────────────────

    /** Consecutive-pings-over-threshold counter. */
    private String streakKey(String rideId, String username) {
        return "reroute:streak:" + rideId + ":" + username;
    }

    /** Epoch-millis of the last successful reroute (cooldown guard). */
    private String lastTimeKey(String rideId, String username) {
        return "reroute:lasttime:" + rideId + ":" + username;
    }

    /**
     * The rider's active personal route coordinates JSON.
     * Set when a reroute is triggered; read by the frontend on the next response.
     */
    private String activeRouteKey(String rideId, String username) {
        return "reroute:active:" + rideId + ":" + username;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Run after every location save. Implements Steps 3-9 from the feature spec:
     *
     * 3. Measure distance from the route polyline.
     * 4. Under threshold → reset streak, return "no reroute."
     * 5. Increment streak; only continue if streak ≥ confirmationStreak.
     * 6. Skip if a reroute happened within the cooldown window.
     * 7. Ask GraphHopper for a new path from the rider's current position.
     * 8. Store the new path in Redis (this rider only).
     * 9. Return the new path so the controller can send it to the app.
     *
     * @param rideId   generatedRidesId — stable identifier for the ride
     * @param username rider whose location just updated
     * @param lat      rider's current latitude
     * @param lon      rider's current longitude
     * @param ride     the Rides entity (route coords + stop points + ending)
     */
    public RerouteResultDTO checkAndRerouteIfNeeded(String rideId, String username,
            double lat, double lon, Rides ride) {
        // ── Step 3: measure distance ──────────────────────────────────────────
        String routeCoords = ride.getRouteCoordinates();
        if (routeCoords == null || routeCoords.isBlank()) {
            AppLogger.debug(this.getClass(),
                    "No routeCoordinates on ride — deviation check skipped",
                    "rideId", rideId);
            return RerouteResultDTO.none();
        }

        double distanceMeters = calculator.distanceFromRoute(lat, lon, routeCoords);
        AppLogger.debug(this.getClass(), "Deviation measured",
                "rider", username, "rideId", rideId, "distanceMeters", distanceMeters);

        // ── Step 4: under threshold → reset streak, nothing to do ────────────
        if (distanceMeters < deviationThresholdMeters) {
            resetStreak(rideId, username);
            return RerouteResultDTO.none();
        }

        // ── Step 5: increment streak; wait for confirmation ───────────────────
        int streak = incrementStreak(rideId, username);
        AppLogger.debug(this.getClass(), "Deviation streak incremented",
                "rider", username, "rideId", rideId, "streak", streak);
        if (streak < confirmationStreak) {
            return RerouteResultDTO.none();
        }

        // ── Step 6: cooldown guard ────────────────────────────────────────────
        if (isInCooldown(rideId, username)) {
            AppLogger.debug(this.getClass(),
                    "Reroute suppressed — still within cooldown window",
                    "rider", username, "rideId", rideId);
            return RerouteResultDTO.none();
        }

        // ── Steps 7-8: call GraphHopper and save the result ───────────────────
        try {
            List<double[]> waypoints = buildRemainingWaypoints(lat, lon, rideId, username, ride);
            AppLogger.info(this.getClass(), "Requesting reroute from GraphHopper",
                    "rider", username, "rideId", rideId, "waypointCount", waypoints.size());

            // Unpack the waypoints list that buildRemainingWaypoints assembled:
            // index 0 = rider's current position (start)
            // index 1 to n-2 = remaining stop points (may be empty)
            // index n-1 = ending location
            double startLat = waypoints.get(0)[0];
            double startLon = waypoints.get(0)[1];
            double endLat = waypoints.get(waypoints.size() - 1)[0];
            double endLon = waypoints.get(waypoints.size() - 1)[1];

            // Convert intermediate [lat, lon] pairs to StopPointDTO.
            // ⚠️ Match the field names to your actual StopPointDTO setters.
            List<StopPointDTO> intermediateStops = new ArrayList<>();
            for (int i = 1; i < waypoints.size() - 1; i++) {
                StopPointDTO dto = new StopPointDTO();
                dto.setStopLatitude(waypoints.get(i)[0]);
                dto.setStopLongitude(waypoints.get(i)[1]);
                intermediateStops.add(dto);
            }

            // ⚠️ Match this to whatever your ride-creation code passes as the
            // routing profile (e.g. "bike", "mtb", "car").
            String routingProfile = ride.getRiderType() != null
                    ? ride.getRiderType().getRiderType()
                    : "bike";

            String newRouteCoordinates = routeService.getRouteDirections(
                    startLon, startLat,
                    endLon, endLat,
                    intermediateStops,
                    routingProfile);

            // Store the new path under this rider's personal Redis key.
            redis.opsForValue().set(
                    activeRouteKey(rideId, username),
                    newRouteCoordinates,
                    redisTtlHours,
                    TimeUnit.HOURS);

            // Update state: reset streak, record reroute time.
            resetStreak(rideId, username);
            setLastRerouteTime(rideId, username);

            AppLogger.info(this.getClass(), "Reroute completed and stored",
                    "rider", username, "rideId", rideId);
            return new RerouteResultDTO(true, newRouteCoordinates);

        } catch (Exception e) {
            // GraphHopper failure should never crash the location-update flow.
            AppLogger.error(this.getClass(),
                    "Reroute failed — returning no-reroute result",
                    "rider", username, "rideId", rideId, "error", e.getMessage());
            return RerouteResultDTO.none();
        }
    }

    /**
     * Deletes all Redis keys for this rider when they leave the ride.
     * Called from {@code StartRideService.leaveRide}.
     */
    public void clearRiderState(String rideId, String username) {
        redis.delete(streakKey(rideId, username));
        redis.delete(lastTimeKey(rideId, username));
        redis.delete(activeRouteKey(rideId, username));
        AppLogger.info(this.getClass(), "Cleared reroute state for rider on leave",
                "rider", username, "rideId", rideId);
    }

    private List<double[]> buildRemainingWaypoints(double lat, double lon,
            String rideId, String username,
            Rides ride) {
        List<double[]> waypoints = new ArrayList<>();
        waypoints.add(new double[] { lat, lon }); // start: rider's current position

        String routeCoords = ride.getRouteCoordinates();

        double riderProgress = (routeCoords != null && !routeCoords.isBlank())
                ? calculator.progressAlongRoute(lat, lon, routeCoords)
                : 0.0;

        Set<Integer> visitedIndices = checkpointRepo
                .findByRideGeneratedRidesIdAndRiderUsernameAndCheckpointType(
                        rideId, username, RideCheckpointArrival.CheckpointType.STOP_POINT)
                .stream()
                .map(RideCheckpointArrival::getCheckpointIndex)
                .collect(Collectors.toSet());

        List<StopPoint> stops = ride.getStopPoints();
        for (int i = 0; i < stops.size(); i++) {
            if (visitedIndices.contains(i))
                continue;

            StopPoint sp = stops.get(i);
            if (sp.getStopLocation() == null)
                continue;

            double stopLat = sp.getStopLocation().getY();
            double stopLon = sp.getStopLocation().getX();

            double stopProgress = (routeCoords != null && !routeCoords.isBlank())
                    ? calculator.progressAlongRoute(stopLat, stopLon, routeCoords)
                    : 1.0;

            if (stopProgress <= riderProgress) {
                AppLogger.debug(this.getClass(),
                        "Stop skipped — rider already past it",
                        "stopIndex", i, "stopProgress", stopProgress,
                        "riderProgress", riderProgress, "rider", username);
                continue;
            }

            waypoints.add(new double[] { stopLat, stopLon });
        }

        if (ride.getEndingLocation() != null) {
            waypoints.add(new double[] {
                    ride.getEndingLocation().getY(),
                    ride.getEndingLocation().getX()
            });
        }

        return waypoints;
    }

    private int incrementStreak(String rideId, String username) {
        String key = streakKey(rideId, username);
        Long count = redis.opsForValue().increment(key);
        redis.expire(key, redisTtlHours, TimeUnit.HOURS);
        return (count != null) ? count.intValue() : 1;
    }

    private void resetStreak(String rideId, String username) {
        redis.delete(streakKey(rideId, username));
    }

    private boolean isInCooldown(String rideId, String username) {
        String value = redis.opsForValue().get(lastTimeKey(rideId, username));
        if (value == null)
            return false;
        try {
            long lastReroute = Long.parseLong(value);
            return (System.currentTimeMillis() - lastReroute) < cooldownSeconds * 1_000L;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private void setLastRerouteTime(String rideId, String username) {
        redis.opsForValue().set(
                lastTimeKey(rideId, username),
                String.valueOf(System.currentTimeMillis()),
                redisTtlHours,
                TimeUnit.HOURS);
    }
}