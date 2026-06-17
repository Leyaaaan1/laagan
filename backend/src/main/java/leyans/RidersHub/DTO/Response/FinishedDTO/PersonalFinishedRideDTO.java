package leyans.RidersHub.DTO.Response.FinishedDTO;



import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.model.FinishedRide.PersonalFinishedRide;
import java.time.LocalDateTime;
import java.util.List;

public class PersonalFinishedRideDTO {

    private Integer id;
    private String riderUsername;
    private String generatedRidesId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private LocalDateTime createdAt;
    private List<CheckpointArrivalResponse> checkpointArrivals;
    private List<StopPointDTO> stopPoints;
    private String startingPointName;
    private String endingPointName;
    private Integer distanceMeters;

    private Double averageSpeedKph;
    public PersonalFinishedRideDTO() {}

    public PersonalFinishedRideDTO(Integer id,
                                   String riderUsername,
                                   String generatedRidesId,
                                   LocalDateTime startTime,
                                   LocalDateTime endTime,
                                   Integer durationMinutes,
                                   LocalDateTime createdAt,
                                   List<CheckpointArrivalResponse> checkpointArrivals,
                                   List<StopPointDTO> stopPoints,
                                   String startingPointName,
                                   String endingPointName,
                                   Integer distanceMeters,
                                   Double averageSpeedKph) {
        this.id = id;
        this.riderUsername = riderUsername;
        this.generatedRidesId = generatedRidesId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
        this.createdAt = createdAt;
        this.checkpointArrivals = checkpointArrivals;
        this.stopPoints = stopPoints;
        this.startingPointName = startingPointName;
        this.endingPointName = endingPointName;
        this.distanceMeters = distanceMeters;
        this.averageSpeedKph = averageSpeedKph;
    }

    public PersonalFinishedRideDTO(Integer id,
                                   String riderUsername,
                                   String generatedRidesId,
                                   LocalDateTime startTime,
                                   LocalDateTime endTime,
                                   Integer durationMinutes,
                                   LocalDateTime createdAt,
                                   List<CheckpointArrivalResponse> checkpointArrivals,
                                   List<StopPointDTO> stopPoints,
                                   String startingPointName,
                                   String endingPointName) {
        this(id, riderUsername, generatedRidesId, startTime, endTime,
                durationMinutes, createdAt, checkpointArrivals, stopPoints,
                startingPointName, endingPointName, null, null);
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

    public List<CheckpointArrivalResponse> getCheckpointArrivals() {
        return checkpointArrivals;
    }

    public void setCheckpointArrivals(List<CheckpointArrivalResponse> checkpointArrivals) {
        this.checkpointArrivals = checkpointArrivals;
    }

    public List<StopPointDTO> getStopPoints() {
        return stopPoints;
    }

    public void setStopPoints(List<StopPointDTO> stopPoints) {
        this.stopPoints = stopPoints;
    }

    public String getStartingPointName() {
        return startingPointName;
    }

    public void setStartingPointName(String startingPointName) {
        this.startingPointName = startingPointName;
    }

    public String getEndingPointName() {
        return endingPointName;
    }

    public void setEndingPointName(String endingPointName) {
        this.endingPointName = endingPointName;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getRiderUsername() { return riderUsername; }
    public void setRiderUsername(String riderUsername) { this.riderUsername = riderUsername; }

    public String getGeneratedRidesId() { return generatedRidesId; }
    public void setGeneratedRidesId(String generatedRidesId) { this.generatedRidesId = generatedRidesId; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}