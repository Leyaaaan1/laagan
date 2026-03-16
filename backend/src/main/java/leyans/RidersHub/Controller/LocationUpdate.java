package leyans.RidersHub.Controller;


import leyans.RidersHub.DTO.Request.LocationDTO.LocationUpdateRequestDTO;
import leyans.RidersHub.DTO.Response.LocationResponseDTO;
import leyans.RidersHub.Service.RideLocationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/location")
public class LocationUpdate {



    final private RideLocationService rideLocationService;

    public LocationUpdate(RideLocationService rideLocationService) {
        this.rideLocationService = rideLocationService;
    }


    @PostMapping("/{generatedRidesId}/update")
    public LocationUpdateRequestDTO updateLocation (@PathVariable Integer generatedRidesId,
            @PathVariable LocationResponseDTO responseDTO) {

        return rideLocationService.updateLocation(
                generatedRidesId,
                responseDTO.getLatitude(),  responseDTO.getLongitude()
        );
    }


    @GetMapping("/{generatedRidesId}/locations")
    public List<LocationUpdateRequestDTO> getParticipantsLocations (@PathVariable Integer generatedRidesId) {

        return rideLocationService.getLatestParticipantLocations(generatedRidesId);
    }
}
