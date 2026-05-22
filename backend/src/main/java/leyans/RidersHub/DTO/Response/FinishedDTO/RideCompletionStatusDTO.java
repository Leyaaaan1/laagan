
// File: RideCompletionStatusDTO.java

package leyans.RidersHub.DTO.Response.FinishedDTO;

public class RideCompletionStatusDTO {
    private int totalParticipants;
    private int participantsAtEnding;
    private boolean isComplete;
    private boolean isActive;

    public RideCompletionStatusDTO(int totalParticipants, int participantsAtEnding,
                                   boolean isComplete, boolean isActive) {
        this.totalParticipants = totalParticipants;
        this.participantsAtEnding = participantsAtEnding;
        this.isComplete = isComplete;
        this.isActive = isActive;
    }

    public int getTotalParticipants() { return totalParticipants; }
    public int getParticipantsAtEnding() { return participantsAtEnding; }
    public boolean isComplete() { return isComplete; }
    public boolean isActive() { return isActive; }
}