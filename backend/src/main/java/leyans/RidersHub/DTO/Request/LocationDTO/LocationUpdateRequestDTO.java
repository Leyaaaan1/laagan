package leyans.RidersHub.DTO.Request.LocationDTO;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.time.LocalDateTime;

public class LocationUpdateRequestDTO {
    private Integer startedRideId;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private double longitude;

    private double distanceMeters;

    private String username;
    private LocalDateTime timestamp;
    private String riderStatus;

    public LocationUpdateRequestDTO(Integer startedRideId, String username,
            double latitude, double longitude, double distanceMeters,
            LocalDateTime timestamp, String riderStatus) {
        this.startedRideId = startedRideId;
        this.username = username;
        this.latitude = latitude;
        this.longitude = longitude;
        this.distanceMeters = distanceMeters;
        this.timestamp = timestamp;
        this.riderStatus = riderStatus;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getRiderStatus() {
        return riderStatus;
    }

    public void setRiderStatus(String riderStatus) {
        this.riderStatus = riderStatus;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Integer getStartedRideId() {
        return startedRideId;
    }

    public void setStartedRideId(Integer startedRideId) {
        this.startedRideId = startedRideId;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public double getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(double distanceMeters) {
        this.distanceMeters = distanceMeters;
    }
}