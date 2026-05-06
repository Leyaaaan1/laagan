package leyans.RidersHub.DTO.Response;


import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Full projection for single-ride detail view.
 * Extends the summary data with routeCoordinates and stopPoints,
 * which are only needed when the user is viewing one specific ride.
 */
public record RideDetailDTO(
        String generatedRidesId,
        String  ridesName,
        String  locationName,
        String  riderType,
        Integer distance,
        LocalDateTime date,
        double  latitude,
        double  longitude,
        String  startingPointName,
        double  startLat,
        double  startLng,
        String  endingPointName,
        double  endLat,
        double  endLng,
        String  mapImageUrl,
        String  magImageStartingLocation,
        String  magImageEndingLocation,
        String  username,
        List<String> participants,
        String  description,
        Boolean active,

        // Detail-only fields
        String           routeCoordinates,
        List<StopPointDTO> stopPoints
)

{

}