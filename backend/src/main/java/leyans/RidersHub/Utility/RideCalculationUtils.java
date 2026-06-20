package leyans.RidersHub.Utility;


import org.springframework.stereotype.Service;

@Service
public class RideCalculationUtils {
    private RideCalculationUtils() {}


    public static Double computeAverageSpeedKph(Integer distanceKm, Integer durationMinutes) {
        if (distanceKm == null || durationMinutes == null || durationMinutes == 0) {
            return null;
        }
        double raw = ((double) distanceKm / durationMinutes) * 60.0;
        return Math.round(raw * 10.0) / 10.0;
    }


    public static Double metersToKm(Integer distanceMeters) {
        if (distanceMeters == null) return null;
        return Math.round((distanceMeters / 1000.0) * 100.0) / 100.0;
    }

    public static Double computeSegmentSpeedKph(double segmentDistanceMeters, long segmentDurationMinutes) {
        if (segmentDurationMinutes == 0) return null;
        double raw = (segmentDistanceMeters / segmentDurationMinutes) * 0.06;
        return Math.round(raw * 10.0) / 10.0;
    }

    public static double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6_371_000; // Earth radius in metres
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
