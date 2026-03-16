package leyans.RidersHub.DTO.Request.RiderDTO;

public class RiderDTO {
    private String username;

    public RiderDTO(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }
}