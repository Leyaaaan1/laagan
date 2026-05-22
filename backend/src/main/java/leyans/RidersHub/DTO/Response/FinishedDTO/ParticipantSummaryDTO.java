
// File: backend/src/main/java/leyans/RidersHub/DTO/Response/ParticipantSummaryDTO.java

package leyans.RidersHub.DTO.Response.FinishedDTO;

public class ParticipantSummaryDTO {

    private String username;
    private Integer checkpointsReached;
    private Integer totalCheckpoints;

    public ParticipantSummaryDTO() {}

    public ParticipantSummaryDTO(String username, Integer checkpointsReached, Integer totalCheckpoints) {
        this.username = username;
        this.checkpointsReached = checkpointsReached;
        this.totalCheckpoints = totalCheckpoints;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Integer getCheckpointsReached() { return checkpointsReached; }
    public void setCheckpointsReached(Integer checkpointsReached) { this.checkpointsReached = checkpointsReached; }

    public Integer getTotalCheckpoints() { return totalCheckpoints; }
    public void setTotalCheckpoints(Integer totalCheckpoints) { this.totalCheckpoints = totalCheckpoints; }
}