package leyans.RidersHub.Service.InteractionRequest;

import leyans.RidersHub.DTO.Request.JoinDTO.JoinRequestCreateDto;
import leyans.RidersHub.DTO.Response.JoinResponseCreateDto;
import leyans.RidersHub.DTO.Response.JoinResponseDTO;
import leyans.RidersHub.Repository.RideJoinRequestRepository;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.RideJoinRequest;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RideJoinRequestService {

    private final RideJoinRequestRepository rideJoinRequestRepository;
    private final RidesRepository ridesRepository;

    private final RiderUtil riderUtil;

    @Autowired
    public RideJoinRequestService(
            RideJoinRequestRepository rideJoinRequestRepository,
            RidesRepository ridesRepository, RiderUtil riderUtil) {
        this.rideJoinRequestRepository = rideJoinRequestRepository;
        this.ridesRepository = ridesRepository;
        this.riderUtil = riderUtil;
    }

    @Transactional
    public JoinResponseCreateDto createJoinRequest(JoinRequestCreateDto createDto) {
        Integer generatedRidesId = createDto.getGeneratedRidesId();
        String username = createDto.getUsername();

        Optional<RideJoinRequest> existingRequest =
                rideJoinRequestRepository.findByGeneratedRidesId_GeneratedRidesIdAndRider_Username(generatedRidesId, username);

        if (existingRequest.isPresent()) {
            RideJoinRequest request = existingRequest.get();
            return convertToDTO(request);
        }

        Rides ride = riderUtil.findRideById(generatedRidesId);
        Rider rider = riderUtil.findRiderByUsername(username);

        RideJoinRequest request = new RideJoinRequest();
        request.setGeneratedRidesId(ride);
        request.setRider(rider);

        RideJoinRequest savedRequest = rideJoinRequestRepository.save(request);
        return convertToDTO(savedRequest);
    }

    private JoinResponseCreateDto convertToDTO(RideJoinRequest request) {
        return new JoinResponseCreateDto(
                request.getId(),
                request.getGeneratedRidesId().getGeneratedRidesId(),
                request.getRider().getUsername()
        );
    }

    @Transactional
    public JoinResponseCreateDto acceptJoinRequest(Integer generatedRidesId, String username, String ridesOwner) {
        RideJoinRequest request = rideJoinRequestRepository
                .findByGeneratedRidesId_GeneratedRidesIdAndRider_Username(generatedRidesId, username)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        Rides ride = request.getGeneratedRidesId();

        if (!ride.getUsername().getUsername().equals(ridesOwner)) {
            throw new RuntimeException("Only the ride owner can accept join requests");
        }

        Rider rider = request.getRider();
        ride.addParticipant(rider);
        ridesRepository.save(ride);

        JoinResponseCreateDto responseDTO = convertToDTO(request);
        rideJoinRequestRepository.delete(request);
        return responseDTO;
    }

    @Transactional(readOnly = true)
    public List<JoinResponseDTO> getJoinRequestsByRideId(Integer generatedRidesId, String requestingUsername) {
        try {
            Rides ride = riderUtil.findRideById(generatedRidesId);

            if (!ride.getUsername().getUsername().equals(requestingUsername)) {
                throw new RuntimeException("Only the ride owner can view join requests");
            }

            List<RideJoinRequest> requests = rideJoinRequestRepository.findByGeneratedRidesId_GeneratedRidesId(generatedRidesId);

            return requests.stream()
                    .map(this::convertToJoinResponseDTO)
                    .collect(Collectors.toList());
        }
        catch (Exception e) {
            System.err.println("Error finding join requests: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to retrieve join requests", e);
        }
    }


    private JoinResponseDTO convertToJoinResponseDTO(RideJoinRequest request) {
        JoinResponseDTO responseDTO = new JoinResponseDTO();
        responseDTO.setId(request.getId());
        responseDTO.setGeneratedRidesId(request.getGeneratedRidesId().getGeneratedRidesId());
        responseDTO.setUsername(request.getRider().getUsername());
        return responseDTO;
    }


}