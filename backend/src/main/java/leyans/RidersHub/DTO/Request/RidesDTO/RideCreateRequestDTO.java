package leyans.RidersHub.DTO.Request.RidesDTO;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class RideCreateRequestDTO {

    @NotBlank(message = "Ride name is required")
    private String ridesName;

    @NotBlank(message = "Location name is required")
    private String locationName;

    @NotBlank(message = "Rider type is required")
    private String riderType;

    @NotNull(message = "Distance is required")
    @Min(value = 1, message = "Distance must be positive")
    private Integer distance;

    @NotNull(message = "Date is required")
    @Future(message = "Date must be in the future")
    private LocalDateTime date;

    @DecimalMin(value = "-90.0", message = "Latitude must be greater than or equal to -90")
    @DecimalMax(value = "90.0", message = "Latitude must be less than or equal to 90")
    private double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be greater than or equal to -180")
    @DecimalMax(value = "180.0", message = "Longitude must be less than or equal to 180")
    private double longitude;

    private List<String> participantUsernames;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @DecimalMin(value = "-90.0", message = "Start latitude must be greater than or equal to -90")
    @DecimalMax(value = "90.0", message = "Start latitude must be less than or equal to 90")
    private double startLatitude;

    @DecimalMin(value = "-180.0", message = "Start longitude must be greater than or equal to -180")
    @DecimalMax(value = "180.0", message = "Start longitude must be less than or equal to 180")
    private double startLongitude;

    @DecimalMin(value = "-90.0", message = "End latitude must be greater than or equal to -90")
    @DecimalMax(value = "90.0", message = "End latitude must be less than or equal to 90")
    private double endLatitude;

    @DecimalMin(value = "-180.0", message = "End longitude must be greater than or equal to -180")
    @DecimalMax(value = "180.0", message = "End longitude must be less than or equal to 180")
    private double endLongitude;


    public String getRidesName() {
        return ridesName;
    }

    public void setRidesName(String ridesName) {
        this.ridesName = ridesName;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getRiderType() {
        return riderType;
    }

    public void setRiderType(String riderType) {
        this.riderType = riderType;
    }

    public Integer getDistance() {
        return distance;
    }

    public void setDistance(Integer distance) {
        this.distance = distance;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
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

    public List<String> getParticipantUsernames() {
        return participantUsernames;
    }

    public void setParticipantUsernames(List<String> participantUsernames) {
        this.participantUsernames = participantUsernames;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getStartLatitude() {
        return startLatitude;
    }

    public void setStartLatitude(double startLatitude) {
        this.startLatitude = startLatitude;
    }

    public double getStartLongitude() {
        return startLongitude;
    }

    public void setStartLongitude(double startLongitude) {
        this.startLongitude = startLongitude;
    }

    public double getEndLatitude() {
        return endLatitude;
    }

    public void setEndLatitude(double endLatitude) {
        this.endLatitude = endLatitude;
    }

    public double getEndLongitude() {
        return endLongitude;
    }

    public void setEndLongitude(double endLongitude) {
        this.endLongitude = endLongitude;
    }
}
