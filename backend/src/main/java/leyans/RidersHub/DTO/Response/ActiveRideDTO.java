package leyans.RidersHub.DTO.Response;

import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Wrapper that combines StartedRide ID with RideDetailDTO
 * Used by /start/active endpoint to provide both the active ride ID
 * and all ride details
 */
public record ActiveRideDTO(
        Integer startedRideId,     // ← From StartedRide table
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
        String           routeCoordinates,
        List<StopPointDTO> stopPoints
) {}