package leyans.RidersHub.DTO.Response.FinishedDTO;

import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.model.FinishedRide.FinishedRide;
import java.time.LocalDateTime;
import java.util.List;

public class FinishedRideResponseDTO {

    private String generatedRidesId;
    private Integer distanceMeters;
    private LocalDateTime rideDate;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String startingPointName;
    private String endingPointName;
    private List<StopPointDTO> stopPoints;
    private String creatorUsername;
    private Integer participantCount;
    private List<ParticipantProgressDTO> participantProgress;
    private List<CheckpointArrivalResponse> checkpointArrivals;

    private Double averageSpeedKph;        // computed: (distance / durationMinutes) * 0.06


    public FinishedRideResponseDTO() {}

    public FinishedRideResponseDTO(FinishedRide finishedRide) {
        this.generatedRidesId = finishedRide.getRide().getGeneratedRidesId();
        this.distanceMeters = finishedRide.getRide().getDistance();
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
    }


    public Integer getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(Integer distanceMeters) {
        this.distanceMeters = distanceMeters;
    }




    public Double getAverageSpeedKph() {
        return averageSpeedKph;
    }

    public void setAverageSpeedKph(Double averageSpeedKph) {
        this.averageSpeedKph = averageSpeedKph;
    }




    public String getGeneratedRidesId() { return generatedRidesId; }
    public void setGeneratedRidesId(String generatedRidesId) { this.generatedRidesId = generatedRidesId; }



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

    public List<ParticipantProgressDTO> getParticipantProgress() { return participantProgress; }
    public void setParticipantProgress(List<ParticipantProgressDTO> participantProgress) { this.participantProgress = participantProgress; }

    public List<CheckpointArrivalResponse> getCheckpointArrivals() { return checkpointArrivals; }
    public void setCheckpointArrivals(List<CheckpointArrivalResponse> checkpointArrivals) { this.checkpointArrivals = checkpointArrivals; }
}