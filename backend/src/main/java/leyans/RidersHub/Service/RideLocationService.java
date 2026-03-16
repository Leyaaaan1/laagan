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


    @Transactional
    public LocationUpdateRequestDTO updateLocation(Integer generatedRidesId, double latitude, double longitude) {
        StartedRide started = riderUtil.findStartedRideByRideId(generatedRidesId);
        String username = riderUtil.getCurrentUsername();
        Rider rider = riderUtil.findRiderByUsername(username);

        if (!started.getParticipants().contains(rider)) {
            throw new IllegalArgumentException("User is not a participant in this ride");
        }

        Point userPoint = locationService.createPoint(longitude, latitude);
        if (userPoint == null) {
            throw new IllegalArgumentException("User location point cannot be null");
        }

        String barangayName = locationService.resolveBarangayName(null, latitude, longitude);

        String locationName = null;
        if (barangayName != null) {
            List<PsgcData> psgcDataList = psgcDataRepository.findByNameIgnoreCase(barangayName);
            locationName = psgcDataList.stream()
                    .findFirst()
                    .map(PsgcData::getName)
                    .orElse(barangayName);
        }

        Point startPoint = started.getLocation();
        double distanceMeters = locationRepo.getDistanceBetweenPoints(userPoint, startPoint);

        RiderLocation loc = new RiderLocation();
        loc.setStartedRide(started);
        loc.setUsername(rider);
        loc.setLocation(userPoint);
        loc.setTimestamp(LocalDateTime.now());
        loc.setDistanceMeters(distanceMeters);
        if (locationName != null) {
            loc.setLocationName(locationName);
        }

        try {
            loc = locationRepo.save(loc);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save rider location", e);
        }

        return new LocationUpdateRequestDTO(
                generatedRidesId,
                username,
                latitude,
                longitude,
                locationName,
                distanceMeters,
                loc.getTimestamp()
        );
    }

    @Transactional(readOnly = true)
    public List<LocationUpdateRequestDTO> getLatestParticipantLocations(Integer generatedRidesId) {
        List<RiderLocation> locations = locationRepo.findLatestLocationPerParticipant(generatedRidesId);

        return locations.stream().map(loc -> {
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
    }





}
