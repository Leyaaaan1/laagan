package leyans.RidersHub.DTO.Response;

public class JoinResponseDTO {

    private Integer id;
    private Integer generatedRidesId;
    private String username;


    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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
