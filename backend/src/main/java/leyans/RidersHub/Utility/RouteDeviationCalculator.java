package leyans.RidersHub.Utility;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.RideCalculationUtils;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Pure geometry helper: measures how far a GPS point is from a stored route polyline.
 *
 * Kept in its own class so the math can be unit-tested independently of Redis,
 * GraphHopper, Spring Security, and everything else.
 *
 * Route coordinates are stored as a JSON string in Rides.routeCoordinates using
 * GeoJSON convention: [[longitude, latitude], [longitude, latitude], …]
 * (i.e. x = longitude, y = latitude — the same ordering GraphHopper returns).
 */
@Component
public class RouteDeviationCalculator {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Returns the shortest distance in metres from {@code (riderLat, riderLon)}
     * to any point on the route polyline.
     *
     * @param riderLat           rider's current latitude
     * @param riderLon           rider's current longitude
     * @param routeCoordinatesJson  stored route as JSON [[lng,lat],[lng,lat],…]
     * @return distance in metres, or {@code Double.MAX_VALUE} if the route
     *         cannot be parsed (treated as "off route" — fail-safe).
     */
    public double distanceFromRoute(double riderLat, double riderLon,
                                    String routeCoordinatesJson) {
        if (routeCoordinatesJson == null || routeCoordinatesJson.isBlank()) {
            return Double.MAX_VALUE;
        }

        List<List<Double>> coords;
        try {
            coords = parseCoordinates(routeCoordinatesJson);
        } catch (Exception e) {
            AppLogger.warn(this.getClass(),
                    "Failed to parse routeCoordinates JSON — skipping deviation check",
                    "error", e.getMessage());
            return Double.MAX_VALUE;
        }

        if (coords.isEmpty()) return Double.MAX_VALUE;

        // Single-point route: just return haversine to that point.
        if (coords.size() == 1) {
            double lng = coords.get(0).get(0);
            double lat = coords.get(0).get(1);
            return RideCalculationUtils.haversineMeters(riderLat, riderLon, lat, lng);
        }

        double minDistance = Double.MAX_VALUE;

        for (int i = 0; i < coords.size() - 1; i++) {
            // GeoJSON: index 0 = longitude, index 1 = latitude
            double aLng = coords.get(i).get(0),     aLat = coords.get(i).get(1);
            double bLng = coords.get(i + 1).get(0), bLat = coords.get(i + 1).get(1);

            double d = pointToSegmentMeters(riderLat, riderLon, aLat, aLng, bLat, bLng);
            if (d < minDistance) {
                minDistance = d;
            }
        }
        return minDistance;
    }

 

    /**
 * Returns the rider's parametric progress along the route polyline as a
 * value in [0.0, 1.0], where 0.0 = route start and 1.0 = route end.
 *
 * Works by finding the segment closest to the rider (same projection math
 * as distanceFromRoute) and converting that segment's local t into a
 * global route fraction.
 *
 * Used by RouteDeviationService to decide which stop points are still
 * geometrically ahead of the rider vs already passed.
 */
public double progressAlongRoute(double riderLat, double riderLon,
                                  String routeCoordinatesJson) {
    if (routeCoordinatesJson == null || routeCoordinatesJson.isBlank()) {
        return 0.0;
    }

    List<List<Double>> coords;
    try {
        coords = parseCoordinates(routeCoordinatesJson);
    } catch (Exception e) {
        AppLogger.warn(this.getClass(),
                "Failed to parse routeCoordinates for progress calculation",
                "error", e.getMessage());
        return 0.0;
    }

    if (coords.size() < 2) return 0.0;

    int totalSegments = coords.size() - 1;
    double bestDistance = Double.MAX_VALUE;
    double bestGlobalT  = 0.0;

    for (int i = 0; i < totalSegments; i++) {
        double aLng = coords.get(i).get(0),     aLat = coords.get(i).get(1);
        double bLng = coords.get(i + 1).get(0), bLat = coords.get(i + 1).get(1);

        // Same cosine-corrected projection used in pointToSegmentMeters
        double midLat = Math.toRadians((aLat + bLat) / 2.0);
        double cosLat = Math.cos(midLat);

        double pX = riderLon * cosLat, pY = riderLat;
        double aX = aLng    * cosLat, aY = aLat;
        double bX = bLng    * cosLat, bY = bLat;

        double dx = bX - aX, dy = bY - aY;
        double lenSq = dx * dx + dy * dy;

        double localT;
        if (lenSq == 0.0) {
            localT = 0.0;
        } else {
            localT = ((pX - aX) * dx + (pY - aY) * dy) / lenSq;
            localT = Math.max(0.0, Math.min(1.0, localT));
        }

        double closestLat = aLat + localT * (bLat - aLat);
        double closestLon = aLng + localT * (bLng - aLng);
        double dist = RideCalculationUtils.haversineMeters(
                riderLat, riderLon, closestLat, closestLon);

        if (dist < bestDistance) {
            bestDistance = dist;
            // Convert segment-local t into a global 0→1 fraction
            bestGlobalT = (i + localT) / totalSegments;
        }
    }

    return bestGlobalT;
}
    private double pointToSegmentMeters(double pLat, double pLon,
                                        double aLat, double aLon,
                                        double bLat, double bLon) {
        // Cosine factor at the midpoint latitude keeps the projection balanced.
        double midLat    = Math.toRadians((aLat + bLat) / 2.0);
        double cosLat    = Math.cos(midLat);

        // Scale longitude so that 1 degree lat ≈ 1 degree scaled-lon in distance.
        double pX = pLon * cosLat, pY = pLat;
        double aX = aLon * cosLat, aY = aLat;
        double bX = bLon * cosLat, bY = bLat;

        double dx = bX - aX, dy = bY - aY;
        double lenSq = dx * dx + dy * dy;

        if (lenSq == 0.0) {
            // Degenerate segment (A == B): return distance to the single point.
            return RideCalculationUtils.haversineMeters(pLat, pLon, aLat, aLon);
        }

        // Parametric projection of P onto A→B, clamped to [0, 1].
        double t = ((pX - aX) * dx + (pY - aY) * dy) / lenSq;
        t = Math.max(0.0, Math.min(1.0, t));

        // Closest point on the segment in original lat/lon.
        double closestLat = aLat + t * (bLat - aLat);
        double closestLon = aLon + t * (bLon - aLon);

        return RideCalculationUtils.haversineMeters(pLat, pLon, closestLat, closestLon);
    }

    /**
     * Extracts a flat list of [lng, lat] points from routeCoordinates, whether
     * it's stored as a plain array (legacy) or as a GeoJSON FeatureCollection
     * (what RouteService actually saves today).
     */
    private List<List<Double>> parseCoordinates(String routeCoordinatesJson) throws Exception {
        JsonNode root = MAPPER.readTree(routeCoordinatesJson);
        List<List<Double>> coords = new java.util.ArrayList<>();

        if (root.isArray()) {
            return MAPPER.convertValue(root, new TypeReference<List<List<Double>>>() {});
        }

        if (root.has("features")) {
            for (JsonNode feature : root.get("features")) {
                JsonNode geometry = feature.path("geometry");
                JsonNode coordinatesNode = geometry.path("coordinates");
                String geomType = geometry.path("type").asText();

                if ("LineString".equals(geomType)) {
                    for (JsonNode pair : coordinatesNode) {
                        coords.add(List.of(pair.get(0).asDouble(), pair.get(1).asDouble()));
                    }
                } else if ("MultiLineString".equals(geomType)) {
                    for (JsonNode line : coordinatesNode) {
                        for (JsonNode pair : line) {
                            coords.add(List.of(pair.get(0).asDouble(), pair.get(1).asDouble()));
                        }
                    }
                }
            }
        }
        return coords;
    }
}