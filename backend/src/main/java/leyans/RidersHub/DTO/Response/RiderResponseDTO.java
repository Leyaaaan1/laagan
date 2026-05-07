package leyans.RidersHub.DTO.Response;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class RiderResponseDTO {
    private Integer id;
    private String username;
    private Boolean enabled;
    private List<String> riderTypes;  // Changed from String to List<String>

    public RiderResponseDTO(Integer id, String username, Boolean enabled, List<String> riderTypes) {
        this.id = id;
        this.username = username;
        this.enabled = enabled;
        this.riderTypes = riderTypes;
    }

    // Constructor that takes a Rider entity
    public RiderResponseDTO(leyans.RidersHub.model.Rider rider) {
        this.id = rider.getId();
        this.username = rider.getUsername();
        this.enabled = rider.getEnabled();

        // Handle List<RiderType> instead of single RiderType
        if (rider.getRiderTypes() != null && !rider.getRiderTypes().isEmpty()) {
            this.riderTypes = rider.getRiderTypes().stream()
                    .map(rt -> rt.getRiderType())
                    .collect(Collectors.toList());
        } else {
            this.riderTypes = new ArrayList<>();
        }
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

    public List<String> getRiderTypes() {
        return riderTypes;
    }

    public void setRiderTypes(List<String> riderTypes) {
        this.riderTypes = riderTypes;
    }
}