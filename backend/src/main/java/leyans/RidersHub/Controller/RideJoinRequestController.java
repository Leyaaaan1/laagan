package leyans.RidersHub.Controller;

import leyans.RidersHub.Config.Security.SecurityUtils;
import leyans.RidersHub.DTO.Request.JoinDTO.JoinRequestCreateDto;
import leyans.RidersHub.DTO.Response.JoinResponseCreateDto;
import leyans.RidersHub.DTO.Response.JoinResponseDTO;
import leyans.RidersHub.Service.InteractionRequest.RideJoinRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/join")
public class RideJoinRequestController {

    private final RideJoinRequestService rideJoinRequestService;

    public RideJoinRequestController(RideJoinRequestService rideJoinRequestService) {
        this.rideJoinRequestService = rideJoinRequestService;
    }

    @PostMapping("/{generatedRidesId}/join-requests")
    public ResponseEntity<JoinResponseCreateDto> createJoinRequest(
            @PathVariable Integer generatedRidesId) {

        ResponseEntity<?> authResponse = SecurityUtils.validateAuthentication();
        if (authResponse != null) {
            return ResponseEntity.status(authResponse.getStatusCode()).build();
        }

        String currentUsername = SecurityUtils.getCurrentUsername();

        JoinRequestCreateDto createDto = new JoinRequestCreateDto();
        createDto.setGeneratedRidesId(generatedRidesId);
        createDto.setUsername(currentUsername);

        JoinResponseCreateDto response = rideJoinRequestService.createJoinRequest(createDto);
        return ResponseEntity.ok(response);
    }

    //rideId is the id in the  ride participants table,
    @PutMapping("/{generatedRidesId}/{username}/accept")
    public ResponseEntity<JoinResponseCreateDto> acceptJoinRequest(
            @PathVariable Integer generatedRidesId,
            @PathVariable String username) {

        ResponseEntity<?> authResponse = SecurityUtils.validateAuthentication();
        if (authResponse != null) {
            return ResponseEntity.status(authResponse.getStatusCode()).build();
        }

        String currentUsername = SecurityUtils.getCurrentUsername();

        JoinResponseCreateDto response = rideJoinRequestService.acceptJoinRequest(generatedRidesId, username, currentUsername);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/{generatedRidesId}/list-requests")
    public ResponseEntity<?> getJoinRequestsByRideId(@PathVariable Integer generatedRidesId) {
        ResponseEntity<?> authResponse = SecurityUtils.validateAuthentication();
        if (authResponse != null) {
            return ResponseEntity.status(authResponse.getStatusCode()).build();
        }
        String currentUsername = SecurityUtils.getCurrentUsername();

        try {
            List<JoinResponseDTO> requests = rideJoinRequestService.getJoinRequestsByRideId(generatedRidesId, currentUsername);

            Map<String, Object> response = new HashMap<>();
            response.put("requests", requests);
            response.put("count", requests.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    }




