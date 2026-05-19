
package leyans.RidersHub.DTO.Response;

import leyans.RidersHub.model.RideCheckpointArrival;
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
}