package leyans.RidersHub.Controller;

import leyans.RidersHub.DTO.Request.RiderProfileRequestDTO;
import leyans.RidersHub.DTO.Response.RiderProfileResponseDTO;
import leyans.RidersHub.Service.RiderProfileService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profiles")
public class RiderProfileController {

    private final RiderProfileService riderProfileService;

    public RiderProfileController(RiderProfileService riderProfileService) {
        this.riderProfileService = riderProfileService;
    }


    @GetMapping("/me")
    public ResponseEntity<RiderProfileResponseDTO> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(
                    riderProfileService.getOrCreateProfile(userDetails.getUsername()));
        } catch (DataIntegrityViolationException e) {
            // Another request created the profile simultaneously — just fetch it
            return ResponseEntity.ok(
                    riderProfileService.getProfile(userDetails.getUsername()));
        }
    }


    @GetMapping("/{username}")
    public ResponseEntity<RiderProfileResponseDTO> getProfile(
            @PathVariable String username) {

        return ResponseEntity.ok(riderProfileService.getProfile(username));
    }

    @PutMapping("/edit")
    public ResponseEntity<RiderProfileResponseDTO> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RiderProfileRequestDTO request) {

        return ResponseEntity.ok(
                riderProfileService.updateProfile(userDetails.getUsername(), request));
    }

    @PostMapping("/add/rider-types/{typeName}")
    public ResponseEntity<RiderProfileResponseDTO> addRiderType(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String typeName) {

        return ResponseEntity.ok(
                riderProfileService.addRiderType(userDetails.getUsername(), typeName));
    }

    @DeleteMapping("/rider-types/{typeName}")
    public ResponseEntity<RiderProfileResponseDTO> removeRiderType(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String typeName) {

        return ResponseEntity.ok(
                riderProfileService.removeRiderType(userDetails.getUsername(), typeName));
    }
}