package leyans.RidersHub.Service;

import leyans.RidersHub.Repository.PsgcDataRepository;
import leyans.RidersHub.Repository.RiderLocationRepository;
import leyans.RidersHub.Service.MapService.NominatimService;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.model.PsgcData;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * Resolves GPS coordinates to human-readable place names for the
 * Mindanao ride-sharing context.
 *
 * Flow for barangay names:
 *   GPS coordinates
 *     → NominatimService (reverse-geocode → raw village/suburb string)
 *     → PsgcDataRepository (normalise to official PSGC barangay name)
 *     → fallback to raw Nominatim value or coordinate string
 *
 * Flow for landmarks / city names:
 *   GPS coordinates
 *     → NominatimService (reverse-geocode → NominatimAddress)
 *     → landmark name if found, otherwise fallback
 */
@Service
public class LocationService {

    private static final GeometryFactory GEOMETRY_FACTORY =
            new GeometryFactory(new PrecisionModel(), 4326);

    private final PsgcDataRepository      psgcDataRepository;
    private final NominatimService        nominatimService;
    private final RiderLocationRepository riderLocationRepository;

    public LocationService(PsgcDataRepository psgcDataRepository,
                           NominatimService nominatimService,
                           RiderLocationRepository riderLocationRepository) {
        this.psgcDataRepository      = psgcDataRepository;
        this.nominatimService        = nominatimService;
        this.riderLocationRepository = riderLocationRepository;
    }

    public Point createPoint(double longitude, double latitude) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(4326);
        return point;
    }




    @Cacheable(value = "landmarks", key = "'barangay_' + #lat + '_' + #lon")
    public String resolveBarangayName(String fallback, double lat, double lon) {
        AppLogger.info(this.getClass(), "resolveBarangayName called", "fallback", fallback, "lat", lat, "lon", lon);

        String nominatimBarangay = nominatimService.getBarangayNameFromCoordinates(lat, lon);

        if (nominatimBarangay == null) {
            AppLogger.warn(this.getClass(), "No barangay found from Nominatim, using fallback", "fallback", fallback);
            return fallback != null ? fallback : formatCoordinates(lat, lon);
        }

        try {
            String result = psgcDataRepository.findByNameIgnoreCase(nominatimBarangay)
                    .stream()
                    .findFirst()
                    .map(PsgcData::getName)
                    .orElse(nominatimBarangay);
            AppLogger.info(this.getClass(), "Barangay resolved successfully", "result", result);
            return result;
        } catch (Exception e) {
            AppLogger.error(this.getClass(), "Failed to resolve barangay name", e);
            return nominatimBarangay;
        }
    }

    @Cacheable(value = "landmarks", key = "'landmark_' + #lat + '_' + #lon")
    public String resolveLandMark(String fallback, double lat, double lon) {

        return nominatimService.getCityOrLandmarkFromCoordinates(lat, lon)

                .map(addr -> {
                    if (!addr.isLandmark()) {
                        return fallback != null ? fallback : formatCoordinates(lat, lon);
                    }
                    return addr.landmark();
                })
                .orElse(fallback != null ? fallback : formatCoordinates(lat, lon));

    }



    public int calculateDistance(Point startPoint, Point endPoint) {
        AppLogger.info(this.getClass(), "calculateDistance called");
        double metres = riderLocationRepository.getDistanceBetweenPoints(startPoint, endPoint);
        int distanceKm = (int) Math.round(metres / 1000.0);
        AppLogger.info(this.getClass(), "Distance calculated", "distanceKm", distanceKm);
        return distanceKm;
    }

    private String formatCoordinates(double lat, double lon) {
        return String.format("Lat: %.6f, Lng: %.6f", lat, lon);
    }
}