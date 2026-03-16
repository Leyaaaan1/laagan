package leyans.RidersHub.DTO.Request.JoinDTO;

public class JoinRequestCreateDto {
    private Integer generatedRidesId;
    private String username;

    public JoinRequestCreateDto() {
    }

    public Integer getGeneratedRidesId() {
        return generatedRidesId;
    }

    public void setGeneratedRidesId(Integer generatedRidesId) {
        this.generatedRidesId = generatedRidesId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}