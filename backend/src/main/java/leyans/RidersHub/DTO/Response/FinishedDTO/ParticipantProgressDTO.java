package leyans.RidersHub.DTO.Response.FinishedDTO;

import java.time.LocalDateTime;

public class ParticipantProgressDTO {

    private String username;
    private Integer checkpointsReached;
    private Integer totalCheckpoints;
    private LocalDateTime arrivalTime;
    private String status; // "COMPLETED", "PARTIALLY_COMPLETED", "STARTED"

    public ParticipantProgressDTO() {}

    public ParticipantProgressDTO(String username,
                                  Integer checkpointsReached,
                                  Integer totalCheckpoints,
                                  LocalDateTime arrivalTime,
                                  String status) {
        this.username = username;
        this.checkpointsReached = checkpointsReached;
        this.totalCheckpoints = totalCheckpoints;
        this.arrivalTime = arrivalTime;
        this.status = status;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Integer getCheckpointsReached() { return checkpointsReached; }
    public void setCheckpointsReached(Integer checkpointsReached) { this.checkpointsReached = checkpointsReached; }

    public Integer getTotalCheckpoints() { return totalCheckpoints; }
    public void setTotalCheckpoints(Integer totalCheckpoints) { this.totalCheckpoints = totalCheckpoints; }

    public LocalDateTime getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(LocalDateTime arrivalTime) { this.arrivalTime = arrivalTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}