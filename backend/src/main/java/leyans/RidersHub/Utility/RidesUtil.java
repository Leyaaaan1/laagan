package leyans.RidersHub.Utility;


import jakarta.persistence.EntityNotFoundException;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.DTO.Response.RideResponseDTO;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Repository.StartedRideRepository;
import leyans.RidersHub.Service.InteractionRequest.InviteRequestService;
import leyans.RidersHub.model.Interaction.InviteRequest;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.StopPoint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RidesUtil {

    public final RidesRepository ridesRepository;
    public final InviteRequestService inviteRequestService;

    private final StartedRideRepository startedRideRepository;

    private final RiderUtil riderUtil;

    public RidesUtil(RidesRepository ridesRepository, InviteRequestService inviteRequestService, StartedRideRepository startedRideRepository, RiderUtil riderUtil) {
        this.ridesRepository = ridesRepository;
        this.inviteRequestService = inviteRequestService;
        this.startedRideRepository = startedRideRepository;
        this.riderUtil = riderUtil;
    }


    @Transactional
    public Rides saveRideWithTransaction(Rides ride, Rider creator) {
        try {
            Rides saved = ridesRepository.save(ride);

            inviteRequestService.generateInviteForNewRide(
                    saved.getGeneratedRidesId(),
                    creator,
                    InviteRequest.InviteStatus.PENDING,
                    LocalDateTime.now(),
                    LocalDateTime.now().plusMonths(1)
            );

            return saved;
        } catch (Exception ex) {
            throw new RuntimeException("Failed to save ride: " + ex.getMessage(), ex);
        }
    }

    public record GeocodeResult(double latitude, double longitude, String name) {}



    @Transactional(readOnly = true)
    public List<StopPointDTO> getStopPointsDTOByGeneratedRideId(Integer generatedRidesId) {
        Rides ride = findRideEntityByGeneratedId(generatedRidesId);
        String currentUsername = riderUtil.getCurrentUsername();
        boolean isOwner = ride.getUsername().getUsername().equals(currentUsername);
        boolean isParticipant = ride.getParticipants().stream()
                .anyMatch(rider -> rider.getUsername().equals(currentUsername));
        if (!isOwner && !isParticipant) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: not owner or participant");
        }
        return mapStopPointsToDTOs(ride.getStopPoints());
    }


    @Transactional
    public String getRideMapImageUrlById(Integer generatedRidesId) {
        Rides ride = findRideEntityByGeneratedId(generatedRidesId);
        return ride.getMapImageUrl();
    }

    @Transactional(readOnly = true)
    public RideResponseDTO findRideByGeneratedId(Integer generatedRidesId) {
        Rides ride = ridesRepository.findByGeneratedRidesIdWithDetails(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Ride not found with ID: " + generatedRidesId));
        return mapToResponseDTO(ride);
    }

    @Transactional(readOnly = true)
    public Page<RideResponseDTO> findRidesByUsernamePaginated(String username, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Rides> ridesPage = ridesRepository.findByUsername_UsernamePaginated(username, pageable);
        return ridesPage.map(this::mapToResponseDTO);
    }

    @Transactional(readOnly = true)
    public Page<RideResponseDTO> getPaginatedRides(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Rides> ridesPage = ridesRepository.findAllActiveSummary(pageable);
        return ridesPage.map(this::mapToResponseDTO);
    }

    @Transactional
    public Rides findRideEntityByGeneratedId(Integer generatedRidesId) {
        return ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Ride not found with ID: " + generatedRidesId));
    }


    public RideResponseDTO mapToResponseDTO(Rides ride) {
        return new RideResponseDTO(
                ride.getGeneratedRidesId(),
                ride.getRidesName(),
                ride.getLocationName(),
                ride.getRiderType(),
                ride.getDistance(),
                ride.getDate(),
                ride.getLocation().getY(),
                ride.getLocation().getX(),
                ride.getParticipants().stream().map(Rider::getUsername).toList(),
                ride.getDescription(),
                ride.getStartingPointName(),
                ride.getStartingLocation().getY(),
                ride.getStartingLocation().getX(),
                ride.getEndingPointName(),
                ride.getEndingLocation().getY(),
                ride.getEndingLocation().getX(),
                ride.getMapImageUrl(),
                ride.getMagImageStartingLocation(),
                ride.getMagImageEndingLocation(),
                ride.getUsername().getUsername(),
                ride.getRouteCoordinates(),

                mapStopPointsToDTOs(ride.getStopPoints()),
                ride.getActive()

        );    }

    public List<StopPointDTO> mapStopPointsToDTOs(List<StopPoint> stopPoints) {
        return stopPoints.stream()
                .map(stopPoint -> new StopPointDTO(
                        stopPoint.getStopName(),
                        stopPoint.getStopLocation().getX(),
                        stopPoint.getStopLocation().getY()
                ))
                .toList();
    }

    public Rides validateAndGetRide(Integer generatedRidesId, Rider initiator) throws AccessDeniedException {
        Rides ride = riderUtil.findRideById(generatedRidesId);

        if (ride == null) {
            throw new RuntimeException("Ride not found with ID: " + generatedRidesId);
        }

        if (ride.getUsername() == null) {
            throw new RuntimeException("Ride does not have a valid creator");
        }

        // Check if the ride is already started
        if (startedRideRepository.existsByRide(ride)) {
            throw new IllegalStateException("This ride has already been started");
        }

        // Check if the initiator already has an ongoing ride
        if (startedRideRepository.existsByUsername(initiator)) {
            throw new IllegalStateException("You already have a ride in progress");
        }

        return ride;
    }

    public int generateUniqueRideId() {
        int randomFourDigitNumber;
        boolean idExists;

        do {
            randomFourDigitNumber = 1000 + (int)(Math.random() * 9000);
            idExists = ridesRepository.findByGeneratedRidesId(randomFourDigitNumber).isPresent();
        } while (idExists);

        return randomFourDigitNumber;
    }



}
