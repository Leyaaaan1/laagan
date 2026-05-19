
package leyans.RidersHub.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CheckpointArrivalRequest {

    @NotBlank(message = "generatedRidesId is required")
    private String generatedRidesId;

    @NotNull(message = "latitude is required")
    private Double latitude;

    @NotNull(message = "longitude is required")
    private Double longitude;

    // For stop point arrival (optional for ending arrival)
    private Integer stopIndex;

    public CheckpointArrivalRequest() {}

    public CheckpointArrivalRequest(String generatedRidesId, Double latitude, Double longitude, Integer stopIndex) {
        this.generatedRidesId = generatedRidesId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.stopIndex = stopIndex;
    }

    public String getGeneratedRidesId() { return generatedRidesId; }
    public void setGeneratedRidesId(String generatedRidesId) { this.generatedRidesId = generatedRidesId; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Integer getStopIndex() { return stopIndex; }
    public void setStopIndex(Integer stopIndex) { this.stopIndex = stopIndex; }
}