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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RideLocationService {

    private final RiderLocationRepository locationRepo;
    private final PsgcDataRepository psgcDataRepository;
    private final LocationService locationService;
    private final RiderUtil riderUtil;

    @Autowired
    public RideLocationService(RiderLocationRepository locationRepo,
                               PsgcDataRepository psgcDataRepository,
                               LocationService locationService,
                               RiderUtil riderUtil) {
        this.locationRepo = locationRepo;
        this.psgcDataRepository = psgcDataRepository;
        this.locationService = locationService;
        this.riderUtil = riderUtil;
    }

    // =========================================================================
    // GET ALL RIDER LOCATIONS (used by /all-riders endpoint)
    // Returns the single latest location row per rider for the given ride.
    // =========================================================================
    @Transactional(readOnly = true)
    public List<LocationUpdateRequestDTO> getAllRiderLocations(Integer generatedRidesId) {
        System.out.println("\n=== 🔍 GET ALL RIDERS' LOCATIONS FOR RIDE: " + generatedRidesId + " ===");

        try {
            StartedRide started = riderUtil.findStartedRideByRideId(generatedRidesId);
            if (started == null) {
                System.err.println("❌ Ride not found: " + generatedRidesId);
                return new ArrayList<>();
            }

            // findLatestLocationPerParticipant returns ONE row per rider (MAX id per username)
            List<RiderLocation> locations = locationRepo.findLatestLocationPerParticipant(started.getId());
            System.out.println("✅ Retrieved " + locations.size() + " location updates");

            List<LocationUpdateRequestDTO> result = locations.stream().map(loc -> {
                Point p = loc.getLocation();
                return new LocationUpdateRequestDTO(
                        generatedRidesId,
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
    // UPDATE LOCATION  (used by POST /{id}/share  and  POST /update/{id})
    //
    // FIX: UPSERT instead of always inserting a new row.
    //      - If this rider already has a row for this ride  → UPDATE it.
    //      - If this is their first update               → INSERT a new row.
    //
    // This means the table always has exactly ONE row per rider per ride,
    // so every call to findLatestLocationPerParticipant returns fresh data.
    // =========================================================================
    @Transactional
    public LocationUpdateRequestDTO updateLocation(Integer generatedRidesId,
                                                   double latitude,
                                                   double longitude) {
        System.out.println("\n=== 💾 UPDATING LOCATION ===");
        System.out.println("Ride ID: " + generatedRidesId);
        System.out.println("Lat: " + latitude + " | Lng: " + longitude);

        try {
            // 1. Resolve the active StartedRide
            StartedRide started = riderUtil.findStartedRideByRideId(generatedRidesId);
            if (started == null) {
                throw new IllegalArgumentException("Ride not found: " + generatedRidesId);
            }
            System.out.println("✓ Found started ride: " + started.getId());

            // 2. Get the currently authenticated rider
            String username = riderUtil.getCurrentUsername();
            System.out.println("✓ Current user: " + username);

            Rider rider = riderUtil.findRiderByUsername(username);
            if (rider == null) {
                throw new IllegalArgumentException("Rider not found: " + username);
            }

            // 3. Authorisation — must be owner OR a participant
            boolean isOwner       = started.getUsername().equals(rider);
            boolean isParticipant = started.getParticipants().contains(rider);

            if (!isOwner && !isParticipant) {
                System.err.println("❌ User is not the owner or a participant in this ride");
                throw new IllegalArgumentException("User is not authorised for this ride");
            }
            System.out.println("✓ Rider is " + (isOwner ? "owner" : "participant"));

            // 4. Build geometry
            Point userPoint = locationService.createPoint(longitude, latitude);
            if (userPoint == null) {
                throw new IllegalArgumentException("Could not create Point geometry");
            }
            System.out.println("✓ Point created: " + userPoint);

            // 5. Reverse-geocode to a barangay name
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

            // 6. Distance from the ride's start point
            Point startPoint    = started.getLocation();
            double distanceMeters = locationRepo.getDistanceBetweenPoints(userPoint, startPoint);
            System.out.println("✓ Distance from start: " + distanceMeters + "m");

            // 7. ✅ UPSERT — reuse existing row if one already exists for this rider+ride.
            //    findFirstBy...OrderByIdDesc picks the newest row and never crashes
            //    even if old duplicate rows exist in the DB from before this fix.
            RiderLocation loc = locationRepo
                    .findFirstByStartedRideAndUsernameOrderByIdDesc(started, rider)
                    .orElse(new RiderLocation());   // first time → new row

            loc.setStartedRide(started);
            loc.setUsername(rider);
            loc.setLocation(userPoint);
            loc.setTimestamp(LocalDateTime.now());
            loc.setDistanceMeters(distanceMeters);
            if (locationName != null) {
                loc.setLocationName(locationName);
            }

            loc = locationRepo.save(loc);   // INSERT on first call, UPDATE on every subsequent call

            // Self-heal: delete any old duplicate rows left over from before the upsert fix.
            // Once the table is clean this becomes a no-op.
            locationRepo.deleteOldDuplicates(started, rider, loc.getId());

            System.out.println("✅ Location saved / updated with ID: " + loc.getId());
            System.out.println("=== ✅ END ===\n");

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

    // =========================================================================
    // GET LATEST PARTICIPANT LOCATIONS  (used by GET /{id}/locations)
    //
    // FIX: Use a LinkedHashSet when building the "all riders" list so that
    //      lean (who is stored as BOTH owner and participant) is only counted once.
    // =========================================================================
    @Transactional(readOnly = true)
    public List<LocationUpdateRequestDTO> getLatestParticipantLocations(Integer generatedRidesId) {
        System.out.println("\n=== 🔍 GET LATEST PARTICIPANT LOCATIONS ===");
        System.out.println("Ride ID: " + generatedRidesId);

        try {
            StartedRide started = riderUtil.findStartedRideByRideId(generatedRidesId);
            if (started == null) {
                System.err.println("❌ Ride not found: " + generatedRidesId);
                return new ArrayList<>();
            }

            // ✅ FIX: Use a Set so the owner is never counted twice even if they
            //         were accidentally added to the participants collection as well.
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
                    // The owner was also stored as a participant — skip the duplicate
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
                Point p   = loc.getLocation();
                return new LocationUpdateRequestDTO(
                        generatedRidesId,
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