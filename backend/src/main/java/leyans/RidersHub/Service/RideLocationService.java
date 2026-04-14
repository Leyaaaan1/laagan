package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
import leyans.RidersHub.ExceptionHandler.UnauthorizedAccessException;
import leyans.RidersHub.Repository.*;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.*;
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

    @Autowired
    public RideLocationService(RiderLocationRepository locationRepo,
                               PsgcDataRepository psgcDataRepository,
                               LocationService locationService, StartedRideRepository startedRideRepository,
                               RiderUtil riderUtil) {
        this.locationRepo = locationRepo;
        this.psgcDataRepository = psgcDataRepository;
        this.locationService = locationService;
        this.startedRideRepository = startedRideRepository;
        this.riderUtil = riderUtil;
    }
    @Transactional(readOnly = true)
    public List<LocationUpdateRequestDTO> getAllRiderLocations(Integer startedRideId) {
        try {
            StartedRide started = riderUtil.findStartedRideById(startedRideId);

            List<RiderLocation> locations = locationRepo.findLatestLocationPerParticipant(started.getId());
            System.out.println("✅ Retrieved " + locations.size() + " location updates");

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

            System.out.println("📤 Returning " + result.size() + " locations\n");
            return result;

        } catch (Exception e) {
            System.err.println("❌ ERROR in getAllRiderLocations: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // =========================================================================
// UPDATE LOCATION
// =========================================================================
    @Transactional
    public LocationUpdateRequestDTO updateLocation(Integer startedRideId,
                                                   double latitude,
                                                   double longitude) {
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

        // ✅ FIX: Provide a fallback so location_name is never null
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
        System.out.println("\n=== 🔍 GET LATEST PARTICIPANT LOCATIONS ===");
        System.out.println("Started Ride ID: " + startedRideId);

        try {
            StartedRide started = riderUtil.findStartedRideById(startedRideId);

            // ✅ Use a Set so the owner is never counted twice
            Set<String> allRiderUsernames = new LinkedHashSet<>();

            if (started.getUsername() != null) {
                allRiderUsernames.add(started.getUsername().getUsername());
                System.out.println("✓ Owner: " + started.getUsername().getUsername());
            }

            for (Rider participant : started.getParticipants()) {
                boolean added = allRiderUsernames.add(participant.getUsername());
                if (added) {
                    System.out.println("✓ Participant: " + participant.getUsername());
                } else {
                    System.out.println("⚠️  Skipping duplicate entry for: " + participant.getUsername());
                }
            }

            System.out.println("📊 Total unique riders in ride: " + allRiderUsernames.size());

            // Fetch ONE location row per rider (latest by id)
            List<RiderLocation> locations =
                    locationRepo.findLatestLocationPerParticipant(started.getId());

            System.out.println("✅ Latest locations retrieved: " + locations.size());
            locations.forEach(loc ->
                    System.out.println("  ✓ Rider: " + loc.getUsername().getUsername()
                            + " | Lat: "  + loc.getLocation().getY()
                            + " | Lng: "  + loc.getLocation().getX()
                            + " | Time: " + loc.getTimestamp()));

            // Convert to DTOs
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

            System.out.println("📤 Returning: " + result.size() + " DTOs");

            // Diagnostic — show who is still missing a location update
            Set<String> ridersWithLocations = result.stream()
                    .map(LocationUpdateRequestDTO::getInitiator)
                    .collect(Collectors.toSet());

            Set<String> ridersWithoutLocations = new LinkedHashSet<>(allRiderUsernames);
            ridersWithoutLocations.removeAll(ridersWithLocations);

            if (!ridersWithoutLocations.isEmpty()) {
                System.out.println("⚠️  Riders WITHOUT a saved location yet:");
                ridersWithoutLocations.forEach(r ->
                        System.out.println("  - " + r + " (waiting for first location share)"));
            }

            System.out.println("=== ✅ END ===\n");
            return result;

        } catch (Exception e) {
            System.err.println("❌ ERROR in getLatestParticipantLocations: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
}