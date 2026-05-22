package leyans.RidersHub.DTO.Response.FinishedDTO;


import java.time.LocalDateTime;

public class ParticipantStatisticsDTO {

    private String username;
    private LocalDateTime arrivalTime;
    private Integer checkpointsCompleted;
    private String status; // "COMPLETED", "PARTIALLY_COMPLETED", "STARTED"

    public ParticipantStatisticsDTO() {}

    public ParticipantStatisticsDTO(String username, LocalDateTime arrivalTime, Integer checkpointsCompleted, String status) {
        this.username = username;
        this.arrivalTime = arrivalTime;
        this.checkpointsCompleted = checkpointsCompleted;
        this.status = status;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public LocalDateTime getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(LocalDateTime arrivalTime) { this.arrivalTime = arrivalTime; }

    public Integer getCheckpointsCompleted() { return checkpointsCompleted; }
    public void setCheckpointsCompleted(Integer checkpointsCompleted) { this.checkpointsCompleted = checkpointsCompleted; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}