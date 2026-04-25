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

    private String locationName;
    private double distanceMeters;

    private String username;

    public LocationUpdateRequestDTO(Integer startedRideId, String username, double latitude, double longitude, String locationName, double distanceMeters, LocalDateTime timestamp) {
        this.startedRideId = startedRideId;
        this.username = username;
        this.latitude = latitude;
        this.longitude = longitude;
        this.distanceMeters = distanceMeters;
        this.locationName = locationName;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
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