package leyans.RidersHub.DTO.Response;


public class RiderResponseDTO {
    private Integer id;
    private String username;
    private Boolean enabled;
    private String riderType;

    public RiderResponseDTO(Integer id, String username, Boolean enabled, String riderType) {
        this.id = id;
        this.username = username;
        this.enabled = enabled;
        this.riderType = riderType;
    }

    // Constructor that takes a Rider entity
    public RiderResponseDTO(leyans.RidersHub.model.Rider rider) {
        this.id = rider.getId();
        this.username = rider.getUsername();
        this.enabled = rider.getEnabled();
        this.riderType = rider.getRiderType() != null ? rider.getRiderType().getRiderType() : null;
    }

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getRiderType() {
        return riderType;
    }

    public void setRiderType(String riderType) {
        this.riderType = riderType;
    }
}