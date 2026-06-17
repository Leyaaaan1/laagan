package leyans.RidersHub.DTO.Response.FinishedDTO;

/**
 * One leg of a rider's personal splits — e.g. "Start" → "Stop 1: Cafe".
 * Mirrors how Strava breaks an activity into laps.
 */
public class SpeedSegmentDTO {

    private String fromLabel;
    private String toLabel;
    private Double distanceMeters;
    private Long durationMinutes;
    private Double averageSpeedKph;

    public SpeedSegmentDTO() {}

    public SpeedSegmentDTO(String fromLabel, String toLabel, Double distanceMeters,
                           Long durationMinutes, Double averageSpeedKph) {
        this.fromLabel = fromLabel;
        this.toLabel = toLabel;
        this.distanceMeters = distanceMeters;
        this.durationMinutes = durationMinutes;
        this.averageSpeedKph = averageSpeedKph;
    }

    public String getFromLabel() { return fromLabel; }
    public void setFromLabel(String fromLabel) { this.fromLabel = fromLabel; }

    public String getToLabel() { return toLabel; }
    public void setToLabel(String toLabel) { this.toLabel = toLabel; }

    public Double getDistanceMeters() { return distanceMeters; }
    public void setDistanceMeters(Double distanceMeters) { this.distanceMeters = distanceMeters; }

    public Long getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Long durationMinutes) { this.durationMinutes = durationMinutes; }

    public Double getAverageSpeedKph() { return averageSpeedKph; }
    public void setAverageSpeedKph(Double averageSpeedKph) { this.averageSpeedKph = averageSpeedKph; }
}