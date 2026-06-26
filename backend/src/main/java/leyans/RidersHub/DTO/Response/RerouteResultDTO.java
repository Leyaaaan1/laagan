package leyans.RidersHub.DTO.Response;

/**
 * Returned from RouteDeviationService to indicate whether a per-rider reroute
 * was triggered for this location update.
 *
 * rerouted == false  → no action needed, frontend continues showing the shared route
 * rerouted == true   → newRouteCoordinates contains the fresh path for this rider only
 */
public class RerouteResultDTO {

    private final boolean rerouted;

    /**
     * JSON coordinate string in the same format as Rides.routeCoordinates
     * (i.e. [[lng,lat],[lng,lat],...]).
     * null when rerouted == false.
     */
    private final String newRouteCoordinates;

    public RerouteResultDTO(boolean rerouted, String newRouteCoordinates) {
        this.rerouted = rerouted;
        this.newRouteCoordinates = newRouteCoordinates;
    }

    /** Convenience factory — no reroute occurred. */
    public static RerouteResultDTO none() {
        return new RerouteResultDTO(false, null);
    }

    public boolean isRerouted() {
        return rerouted;
    }

    public String getNewRouteCoordinates() {
        return newRouteCoordinates;
    }
}