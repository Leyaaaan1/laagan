
package leyans.RidersHub.DTO.Response;

import leyans.RidersHub.model.FinishedRide;
import java.time.LocalDateTime;

public class FinishedRideResponse {

    private Long id;
    private String rideName;
    private String creatorUsername;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private Integer participantCount;

    public FinishedRideResponse() {}

    public FinishedRideResponse(FinishedRide finishedRide) {
        this.id = (long) finishedRide.getId();
        this.rideName = finishedRide.getRide().getRidesName();
        this.creatorUsername = finishedRide.getFinishedBy().getUsername();
        this.startTime = finishedRide.getStartTime();
        this.endTime = finishedRide.getEndTime();
        this.durationMinutes = finishedRide.getDurationMinutes();
        this.participantCount = finishedRide.getCompletedParticipants() != null ? finishedRide.getCompletedParticipants().size() : 0;
    }

    public Long getId() { return id; }
    public String getRideName() { return rideName; }
    public String getCreatorUsername() { return creatorUsername; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public Integer getParticipantCount() { return participantCount; }
}