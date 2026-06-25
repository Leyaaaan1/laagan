package leyans.RidersHub.DTO.Response;

import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;

import java.util.List;

/**
 * Response envelope for POST /location/{startedRideId}/share.
 *
 * Replaces the previous bare List return so that the reroute result (if any)
 * can travel alongside the participant-location snapshot in the same HTTP
 * response without touching any other endpoint.
 */
public class LocationShareResponseDTO {

    /** Latest GPS snapshot for every participant on this ride. */
    private final List<LocationUpdateRequestDTO> locations;

    /**
     * Per-rider reroute result.  Never null; check {@link RerouteResultDTO#isRerouted()}
     * before reading {@code newRouteCoordinates}.
     */
    private final RerouteResultDTO reroute;

    public LocationShareResponseDTO(List<LocationUpdateRequestDTO> locations,
                                    RerouteResultDTO reroute) {
        this.locations = locations;
        this.reroute   = reroute;
    }

    public List<LocationUpdateRequestDTO> getLocations() {
        return locations;
    }

    public RerouteResultDTO getReroute() {
        return reroute;
    }
}