package leyans.RidersHub.Controller;

import leyans.RidersHub.DTO.Response.FinishedDTO.DetailDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.SnapshotResponseDTO;
import leyans.RidersHub.Service.RideDetailService;
import leyans.RidersHub.Service.UploadService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/view")
public class RideDetailController {

    private final RideDetailService rideDetailService;
    private final UploadService uploadService;

    public RideDetailController(RideDetailService rideDetailService, UploadService uploadService) {
        this.rideDetailService = rideDetailService;
        this.uploadService = uploadService;
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


    @PostMapping(value = "/{generatedRidesId}/snapshot", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SnapshotResponseDTO> uploadSnapshot(
            @PathVariable String generatedRidesId,
            @RequestPart("file") MultipartFile file) {

        return ResponseEntity.ok(uploadService.uploadSnapshot(generatedRidesId, file));
    }

    /**
     * GET /rides/{generatedRidesId}/snapshot
     *
     * Returns the stored Cloudinary URL for the ride's snapshot.
     */
    @GetMapping("/{generatedRidesId}/snapshot")
    public ResponseEntity<SnapshotResponseDTO> getSnapshot(
            @PathVariable String generatedRidesId) {

        return ResponseEntity.ok(uploadService.getSnapshot(generatedRidesId));
    }
}
