package leyans.RidersHub.DTO.Response;

public class JoinResponseCreateDto {

    private Integer id;
    private String generatedRidesId;
    private String riderUsername;

    public JoinResponseCreateDto() {
    }
    public JoinResponseCreateDto(Integer id, String generatedRidesId, String riderUsername) {
        this.id = id;
        this.generatedRidesId = generatedRidesId;
        this.riderUsername = riderUsername;
    }



    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getGeneratedRidesId() {
        return generatedRidesId;
    }

    public void setGeneratedRidesId(String generatedRidesId) {
        this.generatedRidesId = generatedRidesId;
    }

    public String getRiderUsername() {
        return riderUsername;
    }

    public void setRiderUsername(String riderUsername) {
        this.riderUsername = riderUsername;
    }


}
