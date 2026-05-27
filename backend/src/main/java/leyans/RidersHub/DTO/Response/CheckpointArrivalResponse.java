
package leyans.RidersHub.DTO.Response;

import leyans.RidersHub.model.participant.RideCheckpointArrival;
import java.time.LocalDateTime;

public class CheckpointArrivalResponse {

    private Integer id;
    private String riderUsername;
    private String checkpointType; // "STOP_POINT" or "ENDING"
    private Integer checkpointIndex;
    private LocalDateTime arrivedAt;

    // Constructor from model
    public CheckpointArrivalResponse(RideCheckpointArrival arrival) {
        this.id = arrival.getId();
        this.riderUsername = arrival.getRider().getUsername();
        this.checkpointType = arrival.getCheckpointType().toString();
        this.checkpointIndex = arrival.getCheckpointIndex();
        this.arrivedAt = arrival.getArrivedAt();
    }

    // Getters
    public Integer getId() { return id; }
    public String getRiderUsername() { return riderUsername; }
    public String getCheckpointType() { return checkpointType; }
    public Integer getCheckpointIndex() { return checkpointIndex; }
    public LocalDateTime getArrivedAt() { return arrivedAt; }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setRiderUsername(String riderUsername) {
        this.riderUsername = riderUsername;
    }

    public void setCheckpointType(String checkpointType) {
        this.checkpointType = checkpointType;
    }

    public void setCheckpointIndex(Integer checkpointIndex) {
        this.checkpointIndex = checkpointIndex;
    }

    public void setArrivedAt(LocalDateTime arrivedAt) {
        this.arrivedAt = arrivedAt;
    }
}