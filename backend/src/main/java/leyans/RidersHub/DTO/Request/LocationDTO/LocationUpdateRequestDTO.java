package leyans.RidersHub.DTO.Request.LocationDTO;

import java.time.LocalDateTime;

public class LocationUpdateRequestDTO {
    private Integer generatedRidesId;
    private double latitude;
    private double longitude;

    private String locationName;
    private double distanceMeters;

    private String initiator;


    public LocationUpdateRequestDTO(Integer generatedRidesId, String initiator, double latitude, double longitude, String locationName, double distanceMeters, LocalDateTime timestamp) {
        this.generatedRidesId = generatedRidesId;
        this.initiator = initiator;
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

    public String getInitiator() {
        return initiator;
    }

    public void setInitiator(String initiator) {
        this.initiator = initiator;
    }


    public Integer getGeneratedRidesId() {
        return generatedRidesId;
    }

    public void setGeneratedRidesId(Integer generatedRidesId) {
        this.generatedRidesId = generatedRidesId;
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