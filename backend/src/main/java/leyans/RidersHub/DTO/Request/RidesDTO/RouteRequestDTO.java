package leyans.RidersHub.DTO.Request.RidesDTO;

import java.util.List;

public class RouteRequestDTO {
    private double startLng;
    private double startLat;
    private double endLng;
    private double endLat;
    private List<StopPointDTO> stopPoints;

    public RouteRequestDTO() {}

    // Getters and Setters
    public double getStartLng() { return startLng; }
    public void setStartLng(double startLng) { this.startLng = startLng; }

    public double getStartLat() { return startLat; }
    public void setStartLat(double startLat) { this.startLat = startLat; }

    public double getEndLng() { return endLng; }
    public void setEndLng(double endLng) { this.endLng = endLng; }

    public double getEndLat() { return endLat; }
    public void setEndLat(double endLat) { this.endLat = endLat; }

    public List<StopPointDTO> getStopPoints() { return stopPoints; }
    public void setStopPoints(List<StopPointDTO> stopPoints) { this.stopPoints = stopPoints; }
}