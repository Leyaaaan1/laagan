package leyans.RidersHub.Service.InteractionRequest;

import leyans.RidersHub.DTO.Request.JoinDTO.JoinRequestCreateDto;
import leyans.RidersHub.DTO.Response.JoinResponseCreateDto;
import leyans.RidersHub.DTO.Response.JoinResponseDTO;
import leyans.RidersHub.Repository.ParticipantLocationRepository;
import leyans.RidersHub.Repository.RideJoinRequestRepository;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Repository.StartedRideRepository;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.RideJoinRequest;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.participant.ParticipantLocation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RideJoinRequestService {

    private final RideJoinRequestRepository rideJoinRequestRepository;

    private final StartedRideRepository startedRideRepository;
    private final RideParticipantService rideParticipantService;  // ← ADD THIS
    private final RiderUtil riderUtil;

    private final ParticipantLocationRepository participantLocationRepository;

    @Autowired
    public RideJoinRequestService(
            RideJoinRequestRepository rideJoinRequestRepository, StartedRideRepository startedRideRepository,
            RideParticipantService rideParticipantService,  // ← ADD THIS
            RiderUtil riderUtil, ParticipantLocationRepository participantLocationRepository) {
        this.rideJoinRequestRepository = rideJoinRequestRepository;
        this.startedRideRepository = startedRideRepository;
        this.rideParticipantService = rideParticipantService;  // ← ADD THIS
        this.riderUtil = riderUtil;
        this.participantLocationRepository = participantLocationRepository;
    }

    @Transactional
    public JoinResponseCreateDto createJoinRequest(JoinRequestCreateDto createDto) {
        String generatedRidesId = createDto.getGeneratedRidesId();
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
    public JoinResponseCreateDto acceptJoinRequest(String generatedRidesId, String username, String ridesOwner) {
        RideJoinRequest request = rideJoinRequestRepository
                .findByGeneratedRidesId_GeneratedRidesIdAndRider_Username(generatedRidesId, username)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        Rides ride = request.getGeneratedRidesId();

        if (!ride.getUsername().getUsername().equals(ridesOwner)) {
            throw new RuntimeException("Only the ride owner can accept join requests");
        }

        // ✅ Add participant to the Rides entity
        rideParticipantService.addParticipantToRide(generatedRidesId, username);

        // ✅ NEW: If ride is already started, also add to StartedRide
        if (ride.getActive()) {
            startedRideRepository.findByRideGeneratedRidesId(generatedRidesId)
                    .ifPresent(startedRide -> {
                        Rider rider = riderUtil.findRiderByUsername(username);

                        // Add to started_ride_participants
                        if (!startedRide.getParticipants().contains(rider)) {
                            startedRide.getParticipants().add(rider);
                            startedRideRepository.save(startedRide);
                        }

                        // Add to participant_locations with starting location
                        ParticipantLocation location = new ParticipantLocation();
                        location.setStartedRide(startedRide);
                        location.setRider(rider);
                        location.setParticipantLocation(startedRide.getLocation());
                        location.setLastUpdate(LocalDateTime.now());
                        participantLocationRepository.save(location);
                    });
        }

        JoinResponseCreateDto responseDTO = convertToDTO(request);
        rideJoinRequestRepository.delete(request);
        return responseDTO;
    }
    @Transactional(readOnly = true)
    public List<JoinResponseDTO> getJoinRequestsByRideId(String generatedRidesId, String requestingUsername) {
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