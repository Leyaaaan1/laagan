package leyans.RidersHub.Service;

import leyans.RidersHub.Repository.PsgcDataRepository;
import leyans.RidersHub.Repository.RiderLocationRepository;
import leyans.RidersHub.Service.MapService.NominatimService;
import leyans.RidersHub.model.PsgcData;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
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



    public String resolveBarangayName(String fallback, double lat, double lon) {
        String nominatimBarangay = nominatimService.getBarangayNameFromCoordinates(lat, lon);

        if (nominatimBarangay == null) {
            return fallback != null ? fallback : formatCoordinates(lat, lon);
        }

        // Attempt to match against the PSGC dataset for the canonical spelling
        return psgcDataRepository.findByNameIgnoreCase(nominatimBarangay)
                .stream()
                .findFirst()
                .map(PsgcData::getName)
                .orElse(nominatimBarangay); // return raw Nominatim name if PSGC has no entry
    }


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
        double metres = riderLocationRepository.getDistanceBetweenPoints(startPoint, endPoint);
        return (int) Math.round(metres / 1000.0);
    }

    private String formatCoordinates(double lat, double lon) {
        return String.format("Lat: %.6f, Lng: %.6f", lat, lon);
    }
}