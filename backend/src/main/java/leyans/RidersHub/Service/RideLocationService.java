package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
import leyans.RidersHub.Repository.*;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.*;
import org.springframework.stereotype.Service;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RideLocationService {

    private final RiderLocationRepository locationRepo;
    private final PsgcDataRepository psgcDataRepository;
    private final LocationService locationService;
    private final RiderUtil riderUtil;

    @Autowired
    public RideLocationService(RiderLocationRepository locationRepo, PsgcDataRepository psgcDataRepository, LocationService locationService, RiderUtil riderUtil) {
        this.locationRepo = locationRepo;
        this.psgcDataRepository = psgcDataRepository;
        this.locationService = locationService;
        this.riderUtil = riderUtil;
    }


    @Transactional(readOnly = true)
    public List<LocationUpdateRequestDTO> getAllRiderLocations() {
        List<RiderLocation> locations = locationRepo.findLatestLocationPerAllRiders();
        return locations.stream().map(loc -> {
            Point p = loc.getLocation();
            return new LocationUpdateRequestDTO(
                    loc.getStartedRide().getRide().getGeneratedRidesId(),
                    loc.getUsername().getUsername(),
                    p.getY(),
                    p.getX(),
                    loc.getLocationName(),
                    loc.getDistanceMeters(),
                    loc.getTimestamp()
            );
        }).collect(Collectors.toList());
    }

    /**
     * Save rider location to database
     * CRITICAL: @Transactional ensures the save is committed before method returns
     */
    @Transactional
    public LocationUpdateRequestDTO updateLocation(Integer generatedRidesId, double latitude, double longitude) {
        System.out.println("\n=== 💾 UPDATING LOCATION ===");
        System.out.println("Ride ID: " + generatedRidesId);
        System.out.println("Lat: " + latitude + " | Lng: " + longitude);

        try {
            // Get the started ride
            StartedRide started = riderUtil.findStartedRideByRideId(generatedRidesId);
            if (started == null) {
                System.err.println("❌ Ride not found: " + generatedRidesId);
                throw new IllegalArgumentException("Ride not found: " + generatedRidesId);
            }
            System.out.println("✓ Found started ride: " + started.getId());

            // Get current logged-in rider
            String username = riderUtil.getCurrentUsername();
            System.out.println("✓ Current user: " + username);

            Rider rider = riderUtil.findRiderByUsername(username);
            if (rider == null) {
                System.err.println("❌ Rider not found: " + username);
                throw new IllegalArgumentException("Rider not found: " + username);
            }

            // Check if rider is participant in this ride
            if (!started.getParticipants().contains(rider)) {
                System.err.println("❌ User is not a participant in this ride");
                throw new IllegalArgumentException("User is not a participant in this ride");
            }
            System.out.println("✓ Rider is participant");

            // Create Point geometry
            Point userPoint = locationService.createPoint(longitude, latitude);
            if (userPoint == null) {
                System.err.println("❌ Could not create Point geometry");
                throw new IllegalArgumentException("User location point cannot be null");
            }
            System.out.println("✓ Point created: " + userPoint);

            // Resolve location name via reverse geocoding
            String barangayName = locationService.resolveBarangayName(null, latitude, longitude);
            String locationName = null;
            if (barangayName != null) {
                List<PsgcData> psgcDataList = psgcDataRepository.findByNameIgnoreCase(barangayName);
                locationName = psgcDataList.stream()
                        .findFirst()
                        .map(PsgcData::getName)
                        .orElse(barangayName);
                System.out.println("✓ Location name: " + locationName);
            }

            // Calculate distance from start point
            Point startPoint = started.getLocation();
            double distanceMeters = locationRepo.getDistanceBetweenPoints(userPoint, startPoint);
            System.out.println("✓ Distance from start: " + distanceMeters + "m");

            // Create and save RiderLocation entity
            RiderLocation loc = new RiderLocation();
            loc.setStartedRide(started);
            loc.setUsername(rider);
            loc.setLocation(userPoint);
            loc.setTimestamp(LocalDateTime.now());
            loc.setDistanceMeters(distanceMeters);
            if (locationName != null) {
                loc.setLocationName(locationName);
            }

            // CRITICAL: Save to database
            loc = locationRepo.save(loc);
            System.out.println("✅ Location saved with ID: " + loc.getId());
            System.out.println("=== ✅ END ===\n");

            // Return DTO
            return new LocationUpdateRequestDTO(
                    generatedRidesId,
                    username,
                    latitude,
                    longitude,
                    locationName,
                    distanceMeters,
                    loc.getTimestamp()
            );

        } catch (IllegalArgumentException e) {
            System.err.println("❌ IllegalArgumentException: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Exception: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to save rider location: " + e.getMessage());
        }
    }

    /**
     * Get latest location for each participant in a ride
     */
    @Transactional(readOnly = true)
    public List<LocationUpdateRequestDTO> getLatestParticipantLocations(Integer generatedRidesId) {
        System.out.println("\n=== 🔍 GET LATEST PARTICIPANT LOCATIONS ===");
        System.out.println("Ride ID: " + generatedRidesId);

        try {
            // Get the started ride to access owner and participants
            StartedRide started = riderUtil.findStartedRideByRideId(generatedRidesId);
            if (started == null) {
                System.err.println("❌ Ride not found: " + generatedRidesId);
                return new ArrayList<>();
            }

            // Build list of ALL riders in the ride (owner + participants)
            List<String> allRiderUsernames = new ArrayList<>();

            // Add owner/initiator
            if (started.getUsername() != null) {
                allRiderUsernames.add(started.getUsername().getUsername());
                System.out.println("✓ Owner: " + started.getUsername().getUsername());
            }

            // Add all participants
            for (Rider participant : started.getParticipants()) {
                allRiderUsernames.add(participant.getUsername());
                System.out.println("✓ Participant: " + participant.getUsername());
            }

            System.out.println("📊 Total riders in ride: " + allRiderUsernames.size());

            // Now query for latest location for each rider
            List<RiderLocation> locations = locationRepo.findLatestLocationPerParticipant(started.getId());
            System.out.println("✅ Latest locations retrieved: " + locations.size());
            locations.forEach(loc -> {
                System.out.println("  ✓ Rider: " + loc.getUsername().getUsername() +
                        " | Lat: " + loc.getLocation().getY() +
                        " | Lng: " + loc.getLocation().getX() +
                        " | Timestamp: " + loc.getTimestamp());
            });

            // Convert to DTOs
            List<LocationUpdateRequestDTO> result = locations.stream().map(loc -> {
                Point p = loc.getLocation();
                double lon = p.getX();
                double lat = p.getY();
                String username = loc.getUsername().getUsername();
                return new LocationUpdateRequestDTO(
                        generatedRidesId,
                        username,
                        lat,
                        lon,
                        loc.getLocationName(),
                        loc.getDistanceMeters(),
                        loc.getTimestamp()
                );
            }).collect(Collectors.toList());

            System.out.println("📤 Returning: " + result.size() + " DTOs");

            // Log which riders have locations saved
            System.out.println("Riders with saved locations:");
            result.forEach(dto -> System.out.println("  - " + dto.getInitiator()));

            // Check for riders WITHOUT locations (haven't shared yet)
            List<String> ridersWithoutLocations = new ArrayList<>(allRiderUsernames);
            result.forEach(dto -> ridersWithoutLocations.remove(dto.getInitiator()));

            if (!ridersWithoutLocations.isEmpty()) {
                System.out.println("⚠️  Riders WITHOUT saved locations:");
                ridersWithoutLocations.forEach(rider -> System.out.println("  - " + rider + " (waiting for first location update)"));
            }

            System.out.println("=== ✅ END ===\n");
            return result;

        } catch (Exception e) {
            System.err.println("❌ ERROR in getLatestParticipantLocations: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }}