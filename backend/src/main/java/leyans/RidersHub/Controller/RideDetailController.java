package leyans.RidersHub.Controller;

import leyans.RidersHub.DTO.Response.FinishedDTO.DetailDTO;
import leyans.RidersHub.Service.RideDetailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


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
}
