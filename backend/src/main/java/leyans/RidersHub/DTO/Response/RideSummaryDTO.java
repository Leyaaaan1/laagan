package leyans.RidersHub.DTO.Response;


import java.time.LocalDateTime;
import java.util.List;

/**
 * Lightweight projection for paginated / list views.
 * Does NOT include routeCoordinates or stopPoints — those are large
 * and unnecessary until the user opens a specific ride.
 */
public record RideSummaryDTO(
        Integer generatedRidesId,
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
        Boolean active
) {}