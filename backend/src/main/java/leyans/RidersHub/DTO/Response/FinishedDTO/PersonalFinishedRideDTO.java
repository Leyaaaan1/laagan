package leyans.RidersHub.DTO.Response.FinishedDTO;



import leyans.RidersHub.model.FinishedRide.PersonalFinishedRide;
import java.time.LocalDateTime;

public class PersonalFinishedRideDTO {

    private Integer id;
    private String riderUsername;
    private String generatedRidesId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private LocalDateTime createdAt;

    public PersonalFinishedRideDTO() {}

    public PersonalFinishedRideDTO(PersonalFinishedRide personalFinishedRide) {
        this.id = personalFinishedRide.getId();
        this.riderUsername = personalFinishedRide.getRider().getUsername();
        this.generatedRidesId = personalFinishedRide.getRide().getGeneratedRidesId();
        this.startTime = personalFinishedRide.getStartTime();
        this.endTime = personalFinishedRide.getEndTime();
        this.durationMinutes = personalFinishedRide.getDurationMinutes();
        this.createdAt = personalFinishedRide.getCreatedAt();
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