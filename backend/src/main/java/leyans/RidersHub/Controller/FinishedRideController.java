
package leyans.RidersHub.Controller;

import leyans.RidersHub.DTO.Request.FinishedRideRequest;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.DTO.Response.FinishedDTO.FinishedRideResponseDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.RideCompletionStatusDTO;
import leyans.RidersHub.Service.FinishedRideService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/ride")
public class FinishedRideController {

    private final FinishedRideService finishedRideService;

    public FinishedRideController(FinishedRideService finishedRideService) {
        this.finishedRideService = finishedRideService;
    }

    @PostMapping("/finished/{generatedRidesId}")
    public ResponseEntity<FinishedRideResponseDTO> finishRide(
            @PathVariable String generatedRidesId) {

        FinishedRideResponseDTO response = finishedRideService.finishRide(generatedRidesId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/finished/{generatedRidesId}/force")
    public ResponseEntity<FinishedRideResponseDTO> forceFinishRide(
            @PathVariable String generatedRidesId) {

        FinishedRideResponseDTO response = finishedRideService.forceFinishRide(generatedRidesId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{generatedRidesId}/completion-status")
    public ResponseEntity<RideCompletionStatusDTO> getRideCompletionStatus(
            @PathVariable String generatedRidesId) {

        RideCompletionStatusDTO status = finishedRideService.getRideCompletionStatus(generatedRidesId);

        return ResponseEntity.ok(status);
    }

    @GetMapping("/{generatedRidesId}/checkpoint-arrivals")
    public ResponseEntity<List<CheckpointArrivalResponse>> getCheckpointArrivals(
            @PathVariable String generatedRidesId) {

        List<CheckpointArrivalResponse> arrivals =
                finishedRideService.getCheckpointArrivalsByRide(generatedRidesId);

        return ResponseEntity.ok(arrivals);
    }

    @GetMapping("/{generatedRidesId}/summary")
    public ResponseEntity<FinishedRideResponseDTO> getFinishedRideSummary(
            @PathVariable String generatedRidesId) {
        FinishedRideResponseDTO summary = finishedRideService.getFinishedRideSummary(generatedRidesId);
        return ResponseEntity.ok(summary);
    }
}