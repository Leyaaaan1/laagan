
package leyans.RidersHub.DTO.Request;

import jakarta.validation.constraints.NotBlank;

public class FinishedRideRequest {

    @NotBlank(message = "generatedRidesId is required")
    private String generatedRidesId;

    public FinishedRideRequest() {}

    public FinishedRideRequest(String generatedRidesId) {
        this.generatedRidesId = generatedRidesId;
    }

    public String getGeneratedRidesId() { return generatedRidesId; }
    public void setGeneratedRidesId(String generatedRidesId) { this.generatedRidesId = generatedRidesId; }
}
