
package leyans.RidersHub.Controller;

import leyans.RidersHub.DTO.Request.FinishedRideRequest;
import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.DTO.Response.FinishedRideResponse;
import leyans.RidersHub.Service.FinishedRideService;
import leyans.RidersHub.model.FinishedRide;
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

    @PostMapping("/finish")
    public ResponseEntity<FinishedRideResponse> finishRide(
            @Valid @RequestBody FinishedRideRequest request) {

        FinishedRide finishedRide = finishedRideService.finishRide(request.getGeneratedRidesId());

        return ResponseEntity.ok(new FinishedRideResponse(finishedRide));
    }

    @GetMapping("/{generatedRidesId}/checkpoint-arrivals")
    public ResponseEntity<List<CheckpointArrivalResponse>> getCheckpointArrivals(
            @PathVariable String generatedRidesId) {

        List<CheckpointArrivalResponse> arrivals =
                finishedRideService.getCheckpointArrivalsByRide(generatedRidesId);

        return ResponseEntity.ok(arrivals);
    }
}