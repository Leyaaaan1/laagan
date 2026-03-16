package leyans.RidersHub.DTO.Response;

public class JoinResponseCreateDto {

    private Integer id;
    private Integer generatedRidesId;
    private String riderUsername;

    public JoinResponseCreateDto() {
    }
    public JoinResponseCreateDto(Integer id, Integer generatedRidesId, String riderUsername) {
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

    public Integer getGeneratedRidesId() {
        return generatedRidesId;
    }

    public void setGeneratedRidesId(Integer generatedRidesId) {
        this.generatedRidesId = generatedRidesId;
    }

    public String getRiderUsername() {
        return riderUsername;
    }

    public void setRiderUsername(String riderUsername) {
        this.riderUsername = riderUsername;
    }


}
