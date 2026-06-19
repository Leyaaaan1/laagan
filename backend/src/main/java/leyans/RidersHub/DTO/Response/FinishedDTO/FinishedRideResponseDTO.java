package leyans.RidersHub.DTO.Response.FinishedDTO;

import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.model.FinishedRide.FinishedRide;
import java.time.LocalDateTime;
import java.util.List;

public class FinishedRideResponseDTO {

    private String generatedRidesId;
    private Integer distance;
    private LocalDateTime rideDate;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String startingPointName;
    private String endingPointName;
    private List<StopPointDTO> stopPoints;
    private String creatorUsername;
    private Integer participantCount;
    private List<ParticipantSummaryDTO> completedParticipants;
    private List<ParticipantStatisticsDTO> participantStats;
    private List<CheckpointArrivalResponse> checkpointArrivals;

    private String routeCoordinates;       // raw GeoJSON string from Rides entity
    private Double averageSpeedKph;        // computed: (distance / durationMinutes) * 0.06

    private String snapshotUrl;

    public FinishedRideResponseDTO() {}

    public FinishedRideResponseDTO(FinishedRide finishedRide) {
        this.generatedRidesId = finishedRide.getRide().getGeneratedRidesId();
        this.distance = finishedRide.getRide().getDistance();
        this.rideDate = finishedRide.getRide().getDate();
        this.startTime = finishedRide.getStartTime();
        this.endTime = finishedRide.getEndTime();
        this.durationMinutes = finishedRide.getDurationMinutes();
        this.startingPointName = finishedRide.getRide().getStartingPointName();
        this.endingPointName = finishedRide.getRide().getEndingPointName();
        this.stopPoints = finishedRide.getRide().getStopPoints().stream()
                .map(sp -> new StopPointDTO(sp.getStopName(), sp.getStopLocation().getX(), sp.getStopLocation().getY()))
                .toList();
        this.creatorUsername = finishedRide.getFinishedBy().getUsername();
        this.participantCount = finishedRide.getCompletedParticipants() != null ? finishedRide.getCompletedParticipants().size() : 0;
        this.snapshotUrl = finishedRide.getSnapshotUrl();
    }


    private static Double computeSpeed(Integer distanceMeters, Integer durationMinutes) {
        if (distanceMeters == null || durationMinutes == null || durationMinutes == 0) {
            return null;
        }
        // km/h = (meters / minutes) * 0.06
        return Math.round(((double) distanceMeters / durationMinutes) * 0.06 * 10.0) / 10.0;
    }

    public String getSnapshotUrl() {
        return snapshotUrl;
    }

    public void setSnapshotUrl(String snapshotUrl) {
        this.snapshotUrl = snapshotUrl;
    }

    public String getRouteCoordinates() {
        return routeCoordinates;
    }

    public void setRouteCoordinates(String routeCoordinates) {
        this.routeCoordinates = routeCoordinates;
    }

    public Double getAverageSpeedKph() {
        return averageSpeedKph;
    }

    public void setAverageSpeedKph(Double averageSpeedKph) {
        this.averageSpeedKph = averageSpeedKph;
    }



// Getters and Setters

    public String getGeneratedRidesId() { return generatedRidesId; }
    public void setGeneratedRidesId(String generatedRidesId) { this.generatedRidesId = generatedRidesId; }



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


    public String getEndingPointName() { return endingPointName; }
    public void setEndingPointName(String endingPointName) { this.endingPointName = endingPointName; }


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