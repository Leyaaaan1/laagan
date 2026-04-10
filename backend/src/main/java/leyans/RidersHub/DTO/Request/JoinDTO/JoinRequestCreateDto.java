package leyans.RidersHub.DTO.Request.JoinDTO;

public class JoinRequestCreateDto {
    private String generatedRidesId;
    private String username;

    public JoinRequestCreateDto() {
    }

    public String getGeneratedRidesId() {
        return generatedRidesId;
    }

    public void setGeneratedRidesId(String generatedRidesId) {
        this.generatedRidesId = generatedRidesId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}