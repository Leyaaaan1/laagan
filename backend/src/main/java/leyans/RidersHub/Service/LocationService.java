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

@Service
public class LocationService {


    private final PsgcDataRepository psgcDataRepository;
    private final NominatimService nominatimService;

    private final RiderLocationRepository riderLocationRepository;


    public LocationService(PsgcDataRepository psgcDataRepository, NominatimService nominatimService, RiderLocationRepository riderLocationRepository) {
        this.psgcDataRepository = psgcDataRepository;
        this.nominatimService = nominatimService;
        this.riderLocationRepository = riderLocationRepository;

    }

    public Point createPoint(double longitude, double latitude) {
        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

        Point point = geometryFactory.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(4326);
        return point;
    }


    public String resolveBarangayName(String fallback, double lat, double lon) {
        String barangay = nominatimService.getBarangayNameFromCoordinates(lat, lon);
        if (barangay == null) {
            return fallback != null ? fallback : "Lat: " + lat + ", Lng: " + lon;
        }
        return psgcDataRepository.findByNameIgnoreCase(barangay)
                .stream()
                .findFirst()
                .map(PsgcData::getName)
                .orElse(barangay);
    }


    public String resolveLandMark(String fallback, double lat, double lon) {
        return nominatimService.getCityOrLandmarkFromCoordinates(lat, lon)
                .map(addr -> {
                    if (!addr.isLandmark()) {
                        return fallback != null ? fallback : formatCoordinates(lat, lon);
                    }
                    return addr.landmark(); // Return Nominatim result directly
                })
                .orElse(fallback != null ? fallback : formatCoordinates(lat, lon));
    }

    public int calculateDistance(Point startPoint, Point endPoint) {
        double distanceInMeters = riderLocationRepository.getDistanceBetweenPoints(startPoint, endPoint);
        return (int) Math.round(distanceInMeters / 1000);
    }
    private String formatCoordinates(double lat, double lon) {
        return String.format("Lat: %.6f, Lng: %.6f", lat, lon);
    }





}
