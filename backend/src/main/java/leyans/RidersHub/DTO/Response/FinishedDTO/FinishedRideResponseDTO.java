package leyans.RidersHub.DTO.Response.FinishedDTO;

import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.model.FinishedRide;
import java.time.LocalDateTime;
import java.util.List;

public class FinishedRideResponseDTO {

    private Long id;
    private String generatedRidesId;
    private String rideName;
    private String description;
    private String locationName;
    private String riderType;
    private Integer distance;
    private LocalDateTime rideDate;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String startingPointName;
    private double startLat;
    private double startLng;
    private String endingPointName;
    private double endLat;
    private double endLng;
    private String mapImageUrl;
    private String routeCoordinates;
    private List<StopPointDTO> stopPoints;
    private String creatorUsername;
    private Integer participantCount;
    private List<ParticipantSummaryDTO> completedParticipants;
    private List<ParticipantStatisticsDTO> participantStats;
    private List<CheckpointArrivalResponse> checkpointArrivals;

    public FinishedRideResponseDTO() {}

    public FinishedRideResponseDTO(FinishedRide finishedRide) {
        this.id = (long) finishedRide.getId();
        this.generatedRidesId = finishedRide.getRide().getGeneratedRidesId();
        this.rideName = finishedRide.getRide().getRidesName();
        this.description = finishedRide.getRide().getDescription();
        this.locationName = finishedRide.getRide().getLocationName();
        this.riderType = finishedRide.getRide().getRiderType().getRiderType();
        this.distance = finishedRide.getRide().getDistance();
        this.rideDate = finishedRide.getRide().getDate();
        this.startTime = finishedRide.getStartTime();
        this.endTime = finishedRide.getEndTime();
        this.durationMinutes = finishedRide.getDurationMinutes();
        this.startingPointName = finishedRide.getRide().getStartingPointName();
        this.startLat = finishedRide.getRide().getStartingLocation().getY();
        this.startLng = finishedRide.getRide().getStartingLocation().getX();
        this.endingPointName = finishedRide.getRide().getEndingPointName();
        this.endLat = finishedRide.getRide().getEndingLocation().getY();
        this.endLng = finishedRide.getRide().getEndingLocation().getX();
        this.mapImageUrl = finishedRide.getRide().getMapImageUrl();
        this.routeCoordinates = finishedRide.getRide().getRouteCoordinates();
        this.stopPoints = finishedRide.getRide().getStopPoints().stream()
                .map(sp -> new StopPointDTO(sp.getStopName(), sp.getStopLocation().getX(), sp.getStopLocation().getY()))
                .toList();
        this.creatorUsername = finishedRide.getFinishedBy().getUsername();
        this.participantCount = finishedRide.getCompletedParticipants() != null ? finishedRide.getCompletedParticipants().size() : 0;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getGeneratedRidesId() { return generatedRidesId; }
    public void setGeneratedRidesId(String generatedRidesId) { this.generatedRidesId = generatedRidesId; }

    public String getRideName() { return rideName; }
    public void setRideName(String rideName) { this.rideName = rideName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public String getRiderType() { return riderType; }
    public void setRiderType(String riderType) { this.riderType = riderType; }

    public Integer getDistance() { return distance; }
    public void setDistance(Integer distance) { this.distance = distance; }

    public LocalDateTime getRideDate() { return rideDate; }
    public void setRideDate(LocalDateTime rideDate) { this.rideDate = rideDate; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getStartingPointName() { return startingPointName; }
    public void setStartingPointName(String startingPointName) { this.startingPointName = startingPointName; }

    public double getStartLat() { return startLat; }
    public void setStartLat(double startLat) { this.startLat = startLat; }

    public double getStartLng() { return startLng; }
    public void setStartLng(double startLng) { this.startLng = startLng; }

    public String getEndingPointName() { return endingPointName; }
    public void setEndingPointName(String endingPointName) { this.endingPointName = endingPointName; }

    public double getEndLat() { return endLat; }
    public void setEndLat(double endLat) { this.endLat = endLat; }

    public double getEndLng() { return endLng; }
    public void setEndLng(double endLng) { this.endLng = endLng; }

    public String getMapImageUrl() { return mapImageUrl; }
    public void setMapImageUrl(String mapImageUrl) { this.mapImageUrl = mapImageUrl; }

    public String getRouteCoordinates() { return routeCoordinates; }
    public void setRouteCoordinates(String routeCoordinates) { this.routeCoordinates = routeCoordinates; }

    public List<StopPointDTO> getStopPoints() { return stopPoints; }
    public void setStopPoints(List<StopPointDTO> stopPoints) { this.stopPoints = stopPoints; }

    public String getCreatorUsername() { return creatorUsername; }
    public void setCreatorUsername(String creatorUsername) { this.creatorUsername = creatorUsername; }

    public Integer getParticipantCount() { return participantCount; }
    public void setParticipantCount(Integer participantCount) { this.participantCount = participantCount; }

    public List<ParticipantSummaryDTO> getCompletedParticipants() { return completedParticipants; }
    public void setCompletedParticipants(List<ParticipantSummaryDTO> completedParticipants) { this.completedParticipants = completedParticipants; }

    public List<ParticipantStatisticsDTO> getParticipantStats() { return participantStats; }
    public void setParticipantStats(List<ParticipantStatisticsDTO> participantStats) { this.participantStats = participantStats; }

    public List<CheckpointArrivalResponse> getCheckpointArrivals() { return checkpointArrivals; }
    public void setCheckpointArrivals(List<CheckpointArrivalResponse> checkpointArrivals) { this.checkpointArrivals = checkpointArrivals; }
}