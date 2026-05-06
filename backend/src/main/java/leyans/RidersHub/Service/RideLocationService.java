package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
import leyans.RidersHub.ExceptionHandler.UnauthorizedAccessException;
import leyans.RidersHub.Repository.*;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.*;
import leyans.RidersHub.model.participant.ParticipantLocation;
import org.springframework.stereotype.Service;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RideLocationService {

    private final RiderLocationRepository locationRepo;
    private final PsgcDataRepository psgcDataRepository;
    private final LocationService locationService;

    private final StartedRideRepository startedRideRepository;
    private final RiderUtil riderUtil;
    private final ParticipantLocationRepository participantLocationRepository;




    @Autowired
    public RideLocationService(RiderLocationRepository locationRepo,
                               PsgcDataRepository psgcDataRepository,
                               LocationService locationService, StartedRideRepository startedRideRepository,
                               RiderUtil riderUtil, ParticipantLocationRepository participantLocationRepository) {
        this.locationRepo = locationRepo;
        this.psgcDataRepository = psgcDataRepository;
        this.locationService = locationService;
        this.startedRideRepository = startedRideRepository;
        this.riderUtil = riderUtil;
        this.participantLocationRepository = participantLocationRepository;
    }
    @Transactional(readOnly = true)
    public List<LocationUpdateRequestDTO> getAllRiderLocations(Integer startedRideId) {
            StartedRide started = riderUtil.findStartedRideById(startedRideId);

            List<RiderLocation> locations = locationRepo.findLatestLocationPerParticipantOptimized(started.getId());
            AppLogger.info(this.getClass(), "Retrieved location updates", "count", locations.size());

            List<LocationUpdateRequestDTO> result = locations.stream().map(loc -> {
                Point p = loc.getLocation();
                return new LocationUpdateRequestDTO(
                        startedRideId,  // ← Pass Integer directly
                        loc.getUsername().getUsername(),
                        p.getY(),   // latitude
                        p.getX(),   // longitude
                        loc.getLocationName(),
                        loc.getDistanceMeters(),
                        loc.getTimestamp()
                );
            }).collect(Collectors.toList());

            AppLogger.info(this.getClass(), "Returning location updates", "count", result.size());
            return result;

            }

    // =========================================================================
// UPDATE LOCATION
// =========================================================================
    @Transactional
    public LocationUpdateRequestDTO updateLocation(Integer startedRideId,
                                                   double latitude,
                                                   double longitude) {
        AppLogger.info(this.getClass(), "updateLocation called", "startedRideId", startedRideId, "latitude", latitude, "longitude", longitude);
        StartedRide started = riderUtil.findStartedRideById(startedRideId);

        String username = riderUtil.getCurrentUsername();
        Rider rider = riderUtil.findRiderByUsername(username);

        boolean isOwner = started.getUsername().getUsername().equals(username);
        boolean isParticipant = started.getParticipants().stream()
                .anyMatch(p -> p.getUsername().equals(username));

        if (!isOwner && !isParticipant) {
            throw new UnauthorizedAccessException.UnauthorizedException(
                    "User is not authorised for this ride");
        }

        Point userPoint = locationService.createPoint(longitude, latitude);

        String barangayName = locationService.resolveBarangayName(null, latitude, longitude);
        String locationName = "Unknown Location"; // ← fallback default
        if (barangayName != null) {
            List<PsgcData> psgcDataList = psgcDataRepository.findByNameIgnoreCase(barangayName);
            locationName = psgcDataList.stream()
                    .findFirst()
                    .map(PsgcData::getName)
                    .orElse(barangayName);
        }

        Point startPoint = started.getLocation();
        double distanceMeters = locationRepo.getDistanceBetweenPoints(userPoint, startPoint);

        RiderLocation loc = locationRepo
                .findFirstByStartedRideAndUsernameOrderByIdDesc(started, rider)
                .orElse(new RiderLocation());

        loc.setStartedRide(started);
        loc.setUsername(rider);
        loc.setLocation(userPoint);
        loc.setTimestamp(LocalDateTime.now());
        loc.setDistanceMeters(distanceMeters);
        loc.setLocationName(locationName); // ← always set, never null

        loc = locationRepo.save(loc);
        locationRepo.deleteOldDuplicates(started, rider, loc.getId());
        AppLogger.info(this.getClass(), "Location updated successfully", "username", username, "distance", distanceMeters);
        return new LocationUpdateRequestDTO(
                startedRideId,
                username,
                latitude,
                longitude,
                locationName,
                distanceMeters,
                loc.getTimestamp()
        );
    }    // =========================================================================
// GET LATEST PARTICIPANT LOCATIONS
// =========================================================================
@Transactional(readOnly = true)
public List<LocationUpdateRequestDTO> getLatestParticipantLocations(Integer startedRideId) {
    AppLogger.info(this.getClass(), "getLatestParticipantLocations called", "startedRideId", startedRideId);

        StartedRide started = riderUtil.findStartedRideById(startedRideId);

        Set<String> allRiderUsernames = new LinkedHashSet<>();
        if (started.getUsername() != null) {
            allRiderUsernames.add(started.getUsername().getUsername());
            AppLogger.info(this.getClass(), "Owner found", "username", started.getUsername().getUsername());
        }

        for (Rider participant : started.getParticipants()) {
            boolean added = allRiderUsernames.add(participant.getUsername());
            if (added) {
                AppLogger.info(this.getClass(), "Participant found", "username", participant.getUsername());
            }
        }

        AppLogger.info(this.getClass(), "Total unique riders", "count", allRiderUsernames.size());

        // Step 1: Get latest LIVE locations from rider_locations
        List<RiderLocation> liveLocations = locationRepo
                .findLatestLocationPerParticipantOptimized(started.getId());

        AppLogger.info(this.getClass(), "Live locations retrieved", "count", liveLocations.size());

        // Step 2: Find who is missing
        Set<String> ridersWithLiveLocations = liveLocations.stream()
                .map(rl -> rl.getUsername().getUsername())
                .collect(Collectors.toSet());

        Set<String> ridersWithoutLiveLocations = new LinkedHashSet<>(allRiderUsernames);
        ridersWithoutLiveLocations.removeAll(ridersWithLiveLocations);

        AppLogger.warn(this.getClass(), "Riders without live locations", "count", ridersWithoutLiveLocations.size());

        // Step 3: For those missing, get from participant_location (fallback)
        List<ParticipantLocation> fallbackLocations = new ArrayList<>();
        for (String username : ridersWithoutLiveLocations) {
            Rider rider = riderUtil.findRiderByUsername(username);
            List<ParticipantLocation> participantLocs = participantLocationRepository
                    .findByStartedRideAndRider(started, rider);

            if (!participantLocs.isEmpty()) {
                fallbackLocations.add(participantLocs.get(0));
                AppLogger.info(this.getClass(), "Using fallback location", "username", username);
            }
        }

        // Step 4: Combine and convert to DTOs
        List<LocationUpdateRequestDTO> result = new ArrayList<>();

        // Add live locations
        result.addAll(liveLocations.stream().map(loc -> {
            Point p = loc.getLocation();
            return new LocationUpdateRequestDTO(
                    startedRideId,
                    loc.getUsername().getUsername(),
                    p.getY(),   // latitude
                    p.getX(),   // longitude
                    loc.getLocationName(),
                    loc.getDistanceMeters(),
                    loc.getTimestamp()
            );
        }).collect(Collectors.toList()));

        // Add fallback locations (from participant_location)
        result.addAll(fallbackLocations.stream().map(loc -> {
            Point p = loc.getParticipantLocation();
            return new LocationUpdateRequestDTO(
                    startedRideId,
                    loc.getRider().getUsername(),
                    p.getY(),   // latitude
                    p.getX(),   // longitude
                    "Starting Point",  // or get from location name
                    0.0,  // no distance available
                    loc.getLastUpdate()
            );
        }).collect(Collectors.toList()));

        AppLogger.info(this.getClass(), "Returning participant locations", "total", result.size());
        return result;


}

    @Transactional
    public List<LocationUpdateRequestDTO> updateLocationAndFetchAll(
            Integer startedRideId,
            double latitude,
            double longitude) {

        // Step 1: Update location (single write operation)
        updateLocation(startedRideId, latitude, longitude);

        // Step 2: Fetch all latest locations in ONE query with JOIN FETCH
        List<RiderLocation> locations =
                locationRepo.findLatestLocationPerParticipantOptimized(startedRideId);

        // Step 3: Convert to DTOs
        return locations.stream().map(loc -> {
            Point p = loc.getLocation();
            return new LocationUpdateRequestDTO(
                    startedRideId,
                    loc.getUsername().getUsername(),
                    p.getY(),   // latitude
                    p.getX(),   // longitude
                    loc.getLocationName(),
                    loc.getDistanceMeters(),
                    loc.getTimestamp()
            );
        }).collect(Collectors.toList());
    }

}