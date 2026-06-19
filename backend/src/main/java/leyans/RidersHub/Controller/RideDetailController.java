package leyans.RidersHub.Controller;

import leyans.RidersHub.DTO.Response.FinishedDTO.DetailDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.SnapshotResponseDTO;
import leyans.RidersHub.Service.RideDetailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/view")
public class RideDetailController {

    private final RideDetailService rideDetailService;

    public RideDetailController(RideDetailService rideDetailService) {
        this.rideDetailService = rideDetailService;
    }

    /**
     * Personal ride detail/share view — name, route, distance, duration,
     * average speed, per-checkpoint speed splits, and the cover photo,
     * scoped to whichever rider is currently authenticated.
     */
    @GetMapping("/{generatedRidesId}/detail")
    public ResponseEntity<DetailDTO> getRideDetail(@PathVariable String generatedRidesId) {
        return ResponseEntity.ok(rideDetailService.getRideDetail(generatedRidesId));
    }

    @PostMapping("/{generatedRidesId}/snapshot")
    public ResponseEntity<SnapshotResponseDTO> uploadSnapshot(
            @PathVariable String generatedRidesId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(rideDetailService.uploadSnapshot(generatedRidesId, file));
    }

    // ─── NEW: Get Snapshot ─────────────────────────────────────
    @GetMapping("/{generatedRidesId}/request")
    public ResponseEntity<SnapshotResponseDTO> getSnapshot(@PathVariable String generatedRidesId) {
        return ResponseEntity.ok(rideDetailService.getSnapshot(generatedRidesId));
    }
}
