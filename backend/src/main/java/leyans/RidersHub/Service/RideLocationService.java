package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
import leyans.RidersHub.ExceptionHandler.UnauthorizedAccessException;
import leyans.RidersHub.Repository.*;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.*;
import leyans.RidersHub.model.participant.ParticipantLocation;
import org.springframework.stereotype.Service;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RideLocationService {

    private final ParticipantLocationRepository participantLocationRepo;
    private final PsgcDataRepository psgcDataRepository;
    private final LocationService locationService;
    private final RiderUtil riderUtil;
    private final StartedRideRepository startedRideRepository;

    private static final double DEFAULT_PROXIMITY_RADIUS_METERS = 5000.0;

    @Autowired
    public RideLocationService(ParticipantLocationRepository participantLocationRepo,
                               PsgcDataRepository psgcDataRepository,
                               LocationService locationService,
                               RiderUtil riderUtil,
                               StartedRideRepository startedRideRepository) {
        this.participantLocationRepo = participantLocationRepo;
        this.psgcDataRepository = psgcDataRepository;
        this.locationService = locationService;
        this.riderUtil = riderUtil;
        this.startedRideRepository = startedRideRepository;
    }

    @Transactional
    public LocationUpdateRequestDTO updateLocation(Integer startedRideId,
                                                   double latitude,
                                                   double longitude) {
        try {
            System.out.println("🔵 STEP 1: Finding started ride: " + startedRideId);
            StartedRide started = riderUtil.findStartedRideById(startedRideId);
            System.out.println("🔵 STEP 2: Found ride: " + started.getId());

            String username = riderUtil.getCurrentUsername();
            System.out.println("🔵 STEP 3: Username: " + username);

            Rider rider = riderUtil.findRiderByUsername(username);
            System.out.println("🔵 STEP 4: Rider found: " + rider.getUsername());

            boolean isOwner = started.getUsername().getUsername().equals(username);
            boolean isParticipant = started.getParticipants().stream()
                    .anyMatch(p -> p.getUsername().equals(username));

            if (!isOwner && !isParticipant) {
                isParticipant = startedRideRepository.isRiderAuthorizedForStartedRide(
                        startedRideId, rider.getId());
            }

            if (!isOwner && !isParticipant) {
                throw new UnauthorizedAccessException.UnauthorizedException(
                        "User is not authorised for this ride");
            }

            Point userPoint = locationService.createPoint(longitude, latitude);
            System.out.println("🔵 STEP 6: Point created");

            String barangayName = locationService.resolveBarangayName(null, latitude, longitude);
            System.out.println("🔵 STEP 7: Barangay: " + barangayName);

            String locationName = "Unknown Location";
            if (barangayName != null) {
                List<PsgcData> psgcDataList = psgcDataRepository.findByNameIgnoreCase(barangayName);
                locationName = psgcDataList.stream()
                        .findFirst()
                        .map(PsgcData::getName)
                        .orElse(barangayName);
            }
            System.out.println("🔵 STEP 8: locationName: " + locationName);

            Point startPoint = started.getLocation();
            System.out.println("🔵 STEP 9: startPoint: " + startPoint);

            double distanceMeters = participantLocationRepo.getDistanceBetweenPoints(
                    latitude, longitude,
                    startPoint.getY(), startPoint.getX());
            System.out.println("🔵 STEP 10: distanceMeters: " + distanceMeters);

            ParticipantLocation loc = participantLocationRepo
                    .findByStartedRide_IdAndRider_Username(startedRideId, username)
                    .orElse(new ParticipantLocation());
            System.out.println("🔵 STEP 11: ParticipantLocation found or new");

            loc.setStartedRide(started);
            loc.setRider(rider);
            loc.setParticipantLocation(userPoint);
            loc.setLastUpdate(LocalDateTime.now());

            System.out.println("🔵 STEP 12: Saving...");
            loc = participantLocationRepo.save(loc);
            System.out.println("🔵 STEP 13: Saved with id: " + loc.getParticipantLocationId());

            System.out.println("🔵 STEP 14: DONE.");

            return new LocationUpdateRequestDTO(
                    startedRideId, username, latitude, longitude,
                    locationName, distanceMeters, loc.getLastUpdate());

        } catch (Exception e) {
            System.err.println("💥 updateLocation CRASHED at: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional
    public List<LocationUpdateRequestDTO> updateLocationAndFetchAll(
            Integer startedRideId,
            double latitude,
            double longitude) {

        System.out.println("\n=== 📤 UPDATE LOCATION AND FETCH ALL ===");
        System.out.println("Started Ride ID: " + startedRideId);
        System.out.println("Location: " + latitude + ", " + longitude);

        try {
            // ✅ Step 1: Update the location
            System.out.println("🔵 Step 1: Updating location...");
            updateLocation(startedRideId, latitude, longitude);
            System.out.println("✅ Location updated successfully");

            // ✅ Step 2: Flush to ensure database persistence
            System.out.println("🔵 Step 2: Flushing to database...");
            participantLocationRepo.flush();
            System.out.println("✅ Flushed to database");

            // ✅ Step 3: Fetch all latest locations (no radius filter in query)
            System.out.println("🔵 Step 3: Fetching all latest participant locations...");
            List<ParticipantLocation> allLocations = participantLocationRepo
                    .findLatestPerParticipantWithinRadius(startedRideId);

            System.out.println("✅ Found " + allLocations.size() + " total locations");

            // ✅ Step 4: Filter by radius in Java (more reliable than complex SQL)
            System.out.println("🔵 Step 4: Filtering locations by radius (" + DEFAULT_PROXIMITY_RADIUS_METERS + "m)...");
            List<ParticipantLocation> filteredLocations = new ArrayList<>();

            for (ParticipantLocation loc : allLocations) {
                double distance = participantLocationRepo.getDistanceBetweenPoints(
                        latitude, longitude,
                        loc.getParticipantLocation().getY(),
                        loc.getParticipantLocation().getX());

                System.out.println("   Checking: " + loc.getRider().getUsername() + " - Distance: " +
                        String.format("%.2f", distance / 1000) + " km");

                if (distance <= DEFAULT_PROXIMITY_RADIUS_METERS) {
                    filteredLocations.add(loc);
                    System.out.println("   ✅ Within radius - INCLUDED");
                } else {
                    System.out.println("   ❌ Outside radius - EXCLUDED");
                }
            }

            System.out.println("✅ Filtered to " + filteredLocations.size() + " locations within " +
                    (DEFAULT_PROXIMITY_RADIUS_METERS / 1000) + "km radius");

            // ✅ Step 5: If no one nearby, return all participants
            if (filteredLocations.isEmpty()) {
                System.out.println("⚠️  No locations within radius, returning all participants...");
                filteredLocations = allLocations;
            }

            // ✅ Step 6: Build response DTOs
            System.out.println("🔵 Step 5: Building response DTOs...");
            List<LocationUpdateRequestDTO> result = new ArrayList<>();

            for (ParticipantLocation loc : filteredLocations) {
                try {
                    Point p = loc.getParticipantLocation();
                    double dist = participantLocationRepo.getDistanceBetweenPoints(
                            latitude, longitude,
                            p.getY(), p.getX());

                    LocationUpdateRequestDTO dto = new LocationUpdateRequestDTO(
                            startedRideId,
                            loc.getRider().getUsername(),
                            p.getY(),
                            p.getX(),
                            null,
                            dist,
                            loc.getLastUpdate()
                    );
                    result.add(dto);
                    System.out.println("   ✅ DTO created for: " + loc.getRider().getUsername());
                } catch (Exception e) {
                    System.err.println("   ❌ ERROR creating DTO for rider: " + e.getMessage());
                    e.printStackTrace();
                }
            }

            System.out.println("✅ All DTOs built successfully");
            System.out.println("📤 Returning: " + result.size() + " locations");
            System.out.println("=== ✅ END ===\n");
            return result;

        } catch (Exception e) {
            System.err.println("\n❌ ERROR in updateLocationAndFetchAll");
            System.err.println("❌ Exception Type: " + e.getClass().getSimpleName());
            System.err.println("❌ Exception Message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("=== ❌ END ERROR ===\n");
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<LocationUpdateRequestDTO> getLatestParticipantLocations(Integer startedRideId) {
        System.out.println("\n=== 🔍 GET LATEST PARTICIPANT LOCATIONS ===");
        System.out.println("Started Ride ID: " + startedRideId);

        try {
            StartedRide started = riderUtil.findStartedRideById(startedRideId);

            List<ParticipantLocation> locations =
                    participantLocationRepo.findLatestPerParticipant(started.getId());

            System.out.println("✅ Latest locations retrieved: " + locations.size());
            locations.forEach(loc ->
                    System.out.println("  ✓ Rider: " + loc.getRider().getUsername()
                            + " | Lat: " + loc.getParticipantLocation().getY()
                            + " | Lng: " + loc.getParticipantLocation().getX()
                            + " | Time: " + loc.getLastUpdate()));

            List<LocationUpdateRequestDTO> result = locations.stream().map(loc -> {
                Point p = loc.getParticipantLocation();
                return new LocationUpdateRequestDTO(
                        startedRideId,
                        loc.getRider().getUsername(),
                        p.getY(),
                        p.getX(),
                        null,
                        0.0,
                        loc.getLastUpdate()
                );
            }).collect(Collectors.toList());

            System.out.println("📤 Returning: " + result.size() + " DTOs");
            System.out.println("=== ✅ END ===\n");
            return result;

        } catch (Exception e) {
            System.err.println("❌ ERROR in getLatestParticipantLocations: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Transactional(readOnly = true)
    public List<LocationUpdateRequestDTO> getNearbyParticipantLocations(
            Integer startedRideId,
            double userLatitude,
            double userLongitude,
            double radiusMeters) {

        System.out.println("\n=== 📍 GET NEARBY PARTICIPANT LOCATIONS (Radius: " + radiusMeters + "m) ===");
        System.out.println("Started Ride ID: " + startedRideId);
        System.out.println("User Location: " + userLatitude + ", " + userLongitude);

        try {
            StartedRide started = riderUtil.findStartedRideById(startedRideId);

            List<ParticipantLocation> locations = participantLocationRepo
                    .findLatestPerParticipantWithinRadius(started.getId());

// Then filter by radius in Java
            locations = locations.stream()
                    .filter(loc -> {
                        double distance = participantLocationRepo.getDistanceBetweenPoints(
                                userLatitude, userLongitude,
                                loc.getParticipantLocation().getY(),
                                loc.getParticipantLocation().getX());
                        return distance <= radiusMeters;
                    })
                    .toList();

            System.out.println("✅ Nearby locations found: " + locations.size());
            locations.forEach(loc -> {
                double dist = participantLocationRepo.getDistanceBetweenPoints(
                        userLatitude, userLongitude,
                        loc.getParticipantLocation().getY(), loc.getParticipantLocation().getX());
                System.out.println("  ✓ Rider: " + loc.getRider().getUsername()
                        + " | Distance: " + String.format("%.2f", dist / 1000) + " km"
                        + " | Time: " + loc.getLastUpdate());
            });

            List<LocationUpdateRequestDTO> result = locations.stream().map(loc -> {
                Point p = loc.getParticipantLocation();
                double dist = participantLocationRepo.getDistanceBetweenPoints(
                        userLatitude, userLongitude,
                        p.getY(), p.getX());
                return new LocationUpdateRequestDTO(
                        startedRideId,
                        loc.getRider().getUsername(),
                        p.getY(),
                        p.getX(),
                        null,
                        dist,
                        loc.getLastUpdate()
                );
            }).collect(Collectors.toList());

            System.out.println("📤 Returning: " + result.size() + " nearby participants");
            System.out.println("=== ✅ END ===\n");
            return result;

        } catch (Exception e) {
            System.err.println("❌ ERROR in getNearbyParticipantLocations: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();  // ✅ Return empty list on error
        }
    }
}