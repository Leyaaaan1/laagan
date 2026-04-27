package leyans.RidersHub.DTO.Request;

public class InviteDetailDTO {
    private String inviteToken;
    private String generatedRidesId;
    private String inviteStatus;

    public InviteDetailDTO(String inviteToken, String generatedRidesId, String inviteStatus) {
        this.inviteToken = inviteToken;
        this.generatedRidesId = generatedRidesId;
        this.inviteStatus = inviteStatus;
    }

    public String getInviteToken() {
        return inviteToken;
    }

    public void setInviteToken(String inviteToken) {
        this.inviteToken = inviteToken;
    }

    public String getGeneratedRidesId() {
        return generatedRidesId;
    }

    public void setGeneratedRidesId(String generatedRidesId) {
        this.generatedRidesId = generatedRidesId;
    }

    public String getInviteStatus() {
        return inviteStatus;
    }

    public void setInviteStatus(String inviteStatus) {
        this.inviteStatus = inviteStatus;
    }
}