package leyans.RidersHub.DTO.Response;

import leyans.RidersHub.DTO.Request.ParticipantLocationDTO;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

public class StartRideResponseDTO implements Serializable {
    private Integer generatedRidesId;
    private String ridesName;
    private String locationName;

    private double latitude;
    private double longitude;
    private LocalDateTime startTime;

    private String initiator;

    private List<String> participantUsernames;


    // Start location coordinates
    private double startLatitude;
    private double startLongitude;
    private String startPointName;

    // Participant information with their initial coordinates
    private List<ParticipantLocationDTO> participants;

    // Route information
    private String routeCoordinates;
    private Integer estimatedDistance;

    public StartRideResponseDTO(Integer generatedRidesId, String initiator, String ridesName, String locationName, List<String> participantUsernames, double longitude, double latitude, LocalDateTime startTime) {
        this.generatedRidesId = generatedRidesId;
        this.initiator = initiator;
        this.ridesName = ridesName;
        this.locationName = locationName;
        this.startTime = startTime;
        this.participantUsernames = participantUsernames;
        this.latitude = latitude;
        this.longitude = longitude;

    }

    public StartRideResponseDTO(Integer generatedRidesId, String ridesName, String locationName, double latitude, double longitude, LocalDateTime startTime, String initiator, List<String> participantUsernames, double startLatitude, double startLongitude, String startPointName, List<ParticipantLocationDTO> participants, String routeCoordinates, Integer estimatedDistance) {
        this.generatedRidesId = generatedRidesId;
        this.ridesName = ridesName;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.startTime = startTime;
        this.initiator = initiator;
        this.participantUsernames = participantUsernames;
        this.startLatitude = startLatitude;
        this.startLongitude = startLongitude;
        this.startPointName = startPointName;
        this.participants = participants;
        this.routeCoordinates = routeCoordinates;
        this.estimatedDistance = estimatedDistance;
    }

    public StartRideResponseDTO() {

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

    public String getStartPointName() {
        return startPointName;
    }

    public void setStartPointName(String startPointName) {
        this.startPointName = startPointName;
    }

    public List<ParticipantLocationDTO> getParticipants() {
        return participants;
    }

    public void setParticipants(List<ParticipantLocationDTO> participants) {
        this.participants = participants;
    }

    public String getRouteCoordinates() {
        return routeCoordinates;
    }

    public void setRouteCoordinates(String routeCoordinates) {
        this.routeCoordinates = routeCoordinates;
    }

    public Integer getEstimatedDistance() {
        return estimatedDistance;
    }

    public void setEstimatedDistance(Integer estimatedDistance) {
        this.estimatedDistance = estimatedDistance;
    }

    public String getInitiator() {
        return initiator;
    }

    public void setInitiator(String initiator) {
        this.initiator = initiator;
    }

    public List<String> getParticipantUsernames() {
        return participantUsernames;
    }

    public void setParticipantUsernames(List<String> participantUsernames) {
        this.participantUsernames = participantUsernames;
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

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
}