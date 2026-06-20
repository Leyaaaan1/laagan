
package leyans.RidersHub.Controller;

import leyans.RidersHub.DTO.Response.CheckpointArrivalResponse;
import leyans.RidersHub.DTO.Response.FinishedDTO.FinishedRideResponseDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.PersonalFinishedRideDTO;
import leyans.RidersHub.Service.FinishedRideService;
import leyans.RidersHub.Service.PersonalFinishedRideService;
import leyans.RidersHub.Utility.CheckPointUtility;
import leyans.RidersHub.Utility.FinishedRideUtility;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ride")
public class FinishedRideController {

    private final FinishedRideService finishedRideService;
    private final FinishedRideUtility finishedRideUtility;
    private final CheckPointUtility checkPointUtility;

    private final PersonalFinishedRideService personalFinishedRideService;


    public FinishedRideController(FinishedRideService finishedRideService, FinishedRideUtility finishedRideUtility, CheckPointUtility checkPointUtility, PersonalFinishedRideService personalFinishedRideService) {
        this.finishedRideService = finishedRideService;
        this.finishedRideUtility = finishedRideUtility;
        this.checkPointUtility = checkPointUtility;
        this.personalFinishedRideService = personalFinishedRideService;
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


    @PostMapping("/finished/{generatedRidesId}/force/ownride")
    public ResponseEntity<FinishedRideResponseDTO> forceFinishRideParticipants(
            @PathVariable String generatedRidesId) {

        FinishedRideResponseDTO response = finishedRideService.forceFinishOwnRide(generatedRidesId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{generatedRidesId}/checkpoint-arrivals")
    public ResponseEntity<List<CheckpointArrivalResponse>> getCheckpointArrivals(
            @PathVariable String generatedRidesId) {

        List<CheckpointArrivalResponse> arrivals =
                checkPointUtility.getCheckpointArrivalsByRide(generatedRidesId);

        return ResponseEntity.ok(arrivals);
    }

    @GetMapping("/{generatedRidesId}/summary")
    public ResponseEntity<FinishedRideResponseDTO> getFinishedRideSummary(
            @PathVariable String generatedRidesId) {
        FinishedRideResponseDTO summary = finishedRideUtility.getFinishedRideSummary(generatedRidesId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{generatedRidesId}/personal-summary")
    public ResponseEntity<PersonalFinishedRideDTO> getPersonalSummary(
            @PathVariable String generatedRidesId) {
        return ResponseEntity.ok(personalFinishedRideService.getPersonalSummaryDTO(generatedRidesId));
    }



}