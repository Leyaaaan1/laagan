package leyans.RidersHub.DTO.Request.RidesDTO;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class RideRequestDTO {

    private String generatedRidesId;
    private String username;
    @NotBlank
    @Size(min = 2, max = 100, message = "Ride name must be 2-100 characters")
    String ridesName;


    private String locationName;
    private boolean isLocationFromSearch;
    private String riderType;
    private Integer distance;

    private LocalDateTime date;
    @Min(-90) @Max(90)
    double latitude;

    @Min(-180) @Max(180)
    double longitude;
    private List<String> participants;
    @Size(max = 1000)
    String description;
    String startingPointName;
    double startLat;
    double startLng;
    String endingPointName;
    double endLat;
    double endLng;
    private String mapImageUrl;
    private String routeCoordinates;
    private List<StopPointDTO> stopPoints;

    private boolean isStartingPointFromSearch;
    private boolean isEndingPointFromSearch;
    private List<Boolean> stopPointsFromSearch;

    public RideRequestDTO() {
    }


    public RideRequestDTO(String generatedRidesId, String username, String ridesName, String locationName, boolean isLocationFromSearch, String riderType, Integer distance, LocalDateTime date, double latitude, double longitude, List<String> participants, String description, String startingPointName, double startLat, double startLng, String endingPointName, double endLat, double endLng, String mapImageUrl, String routeCoordinates, List<StopPointDTO> stopPoints, boolean isStartingPointFromSearch, boolean isEndingPointFromSearch, List<Boolean> stopPointsFromSearch) {
        this.generatedRidesId = generatedRidesId;
        this.username = username;
        this.ridesName = ridesName;
        this.locationName = locationName;
        this.isLocationFromSearch = isLocationFromSearch;
        this.riderType = riderType;
        this.distance = distance;
        this.date = date;
        this.latitude = latitude;
        this.longitude = longitude;
        this.participants = participants;
        this.description = description;
        this.startingPointName = startingPointName;
        this.startLat = startLat;
        this.startLng = startLng;
        this.endingPointName = endingPointName;
        this.endLat = endLat;
        this.endLng = endLng;
        this.mapImageUrl = mapImageUrl;
        this.routeCoordinates = routeCoordinates;
        this.stopPoints = stopPoints;
        this.isStartingPointFromSearch = isStartingPointFromSearch;
        this.isEndingPointFromSearch = isEndingPointFromSearch;
        this.stopPointsFromSearch = stopPointsFromSearch;
    }

    public boolean isStartingPointFromSearch() {
        return isStartingPointFromSearch;
    }

    public void setStartingPointFromSearch(boolean startingPointFromSearch) {
        isStartingPointFromSearch = startingPointFromSearch;
    }

    public boolean isEndingPointFromSearch() {
        return isEndingPointFromSearch;
    }

    public void setEndingPointFromSearch(boolean endingPointFromSearch) {
        isEndingPointFromSearch = endingPointFromSearch;
    }

    public List<Boolean> getStopPointsFromSearch() {
        return stopPointsFromSearch;
    }

    public void setStopPointsFromSearch(List<Boolean> stopPointsFromSearch) {
        this.stopPointsFromSearch = stopPointsFromSearch;
    }

    public boolean isLocationFromSearch() {
        return isLocationFromSearch;
    }

    public void setLocationFromSearch(boolean locationFromSearch) {
        isLocationFromSearch = locationFromSearch;
    }

    public String getRouteCoordinates() {
        return routeCoordinates;
    }

    public void setRouteCoordinates(String routeCoordinates) {
        this.routeCoordinates = routeCoordinates;
    }

    public List<StopPointDTO> getStopPoints() {
        return stopPoints;
    }

    public void setStopPoints(List<StopPointDTO> stopPoints) {
        this.stopPoints = stopPoints;
    }


    public String getGeneratedRidesId() {
        return generatedRidesId;
    }

    public void setGeneratedRidesId(String generatedRidesId) {
        this.generatedRidesId = generatedRidesId;
    }

    public String getMapImageUrl() {
        return mapImageUrl;
    }

    public void setMapImageUrl(String mapImageUrl) {
        this.mapImageUrl = mapImageUrl;
    }

    public String getStartingPointName() {
        return startingPointName;
    }

    public void setStartingPointName(String startingPointName) {
        this.startingPointName = startingPointName;
    }

    public double getStartLat() {
        return startLat;
    }

    public void setStartLat(double startLat) {
        this.startLat = startLat;
    }

    public double getStartLng() {
        return startLng;
    }

    public void setStartLng(double startLng) {
        this.startLng = startLng;
    }

    public String getEndingPointName() {
        return endingPointName;
    }

    public void setEndingPointName(String endingPointName) {
        this.endingPointName = endingPointName;
    }

    public double getEndLat() {
        return endLat;
    }

    public void setEndLat(double endLat) {
        this.endLat = endLat;
    }

    public double getEndLng() {
        return endLng;
    }

    public void setEndLng(double endLng) {
        this.endLng = endLng;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getParticipants() {
        return participants;
    }

    public void setParticipants(List<String> participants) {
        this.participants = participants;
    }



    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

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


}
