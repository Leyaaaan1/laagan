package leyans.RidersHub.Controller;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import leyans.RidersHub.Config.Security.SecurityUtils;
import leyans.RidersHub.DTO.Request.RiderDTO.RiderTypeRequest;
import leyans.RidersHub.DTO.Request.RidesDTO.RideRequestDTO;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.DTO.Response.RideResponseDTO;
import leyans.RidersHub.Service.LocationService;
import leyans.RidersHub.Service.RiderService;
import leyans.RidersHub.Service.RidesService;
import leyans.RidersHub.Utility.RidesUtil;
import leyans.RidersHub.model.RiderType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/riders")
public class RiderController {

    private final RiderService riderService;
    private final RidesService ridesService;
    private final RidesUtil ridesUtil;


    @Autowired
    public RiderController(RiderService riderService, RidesService ridesService, RidesUtil ridesUtil) {
        this.riderService = riderService;
        this.ridesService = ridesService;
        this.ridesUtil = ridesUtil;
    }

    @PostMapping("/rider-type")
    public ResponseEntity<RiderType> addRiderType(@RequestBody RiderTypeRequest request) {
        RiderType riderType = riderService.addRiderType(request.getRiderType());
        return ResponseEntity.ok(riderType);
    }

    @GetMapping("/current-rider-type")
    public ResponseEntity<RiderType> getCurrentUserRiderType() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        RiderType riderType = riderService.getCurrentUserRiderType(username);
        return ResponseEntity.ok(riderType);
    }


    @PostMapping("/create")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createRide(@Valid @RequestBody RideRequestDTO rideRequest) {
        try {
            String username = SecurityUtils.getCurrentUsername();

            RideResponseDTO response = ridesService.createRide(
                    rideRequest.getGeneratedRidesId(),
                    username,
                    rideRequest.getRidesName(),
                    rideRequest.getLocationName(),
                    rideRequest.getRiderType(),
                    rideRequest.getDate(),
                    rideRequest.getParticipants(),
                    rideRequest.getDescription(),
                    rideRequest.getLatitude(),
                    rideRequest.getLongitude(),
                    rideRequest.getStartLat(),
                    rideRequest.getStartLng(),
                    rideRequest.getEndLat(),
                    rideRequest.getEndLng(),
                    rideRequest.getStopPoints()
            );
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Related entity not found: " + e.getMessage());
        }  catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid request: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating ride: " + e.getMessage());
        }
    }


    @GetMapping("/{generatedRidesId}/stop-points")
    public List<StopPointDTO> getStopPointsByRideId(@PathVariable Integer generatedRidesId)   {
        return ridesUtil.getStopPointsDTOByGeneratedRideId(generatedRidesId);
    }



    @GetMapping("/{generatedRidesId}/map-image")
    public ResponseEntity<String> getRideMapImage(@PathVariable Integer generatedRidesId) {
        try {
            String mapImageUrl = ridesUtil.getRideMapImageUrlById(generatedRidesId);
            return ResponseEntity.ok(mapImageUrl);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving map image: " + e.getMessage());
        }
    }

    @GetMapping("/{generatedRidesId}")
    public ResponseEntity<?> getRideDetailsByGeneratedId(@PathVariable Integer generatedRidesId) {
        try {
            RideResponseDTO ride = ridesUtil.findRideByGeneratedId(generatedRidesId);
            return ResponseEntity.ok(ride);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Ride not found: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving ride details: " + e.getMessage());
        }
    }

//    @GetMapping("/my-rides")
//    @PreAuthorize("isAuthenticated()")
//    public ResponseEntity<?> getMyRides() {
//        try {
//            String username = SecurityContextHolder.getContext().getAuthentication().getName();
//            List<RideResponseDTO> rides = ridesUtil.findRidesByUsername(username);
//            return ResponseEntity.ok(rides);
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body("Error retrieving rides: " + e.getMessage());
//        }
//    }
//
//
//
//
//    @GetMapping("/rides")
//    public ResponseEntity<?> getPaginatedRides(
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "5") int size) {
//        try {
//                ResponseEntity<?> authResponse = SecurityUtils.validateAuthentication();
//                if (authResponse != null) {
//                    return authResponse;
//                }
//
//                Page<RideResponseDTO> rides = ridesUtil.getPaginatedRides(page, size);
//                return ResponseEntity.ok(rides);
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body("Error retrieving rides: " + e.getMessage());
//        }
//    }

    @GetMapping("/my-rides")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyRides(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Page<RideResponseDTO> rides = ridesUtil.findRidesByUsernamePaginated(username, page, size);
            return ResponseEntity.ok(rides);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving rides: " + e.getMessage());
        }
    }

    @GetMapping("/rides")
    public ResponseEntity<?> getPaginatedRides(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            ResponseEntity<?> authResponse = SecurityUtils.validateAuthentication();
            if (authResponse != null) {
                return authResponse;
            }

            Page<RideResponseDTO> rides = ridesUtil.getPaginatedRides(page, size);
            return ResponseEntity.ok(rides);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving rides: " + e.getMessage());
        }
    }


}
