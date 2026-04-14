package leyans.RidersHub.Utility;


import jakarta.persistence.EntityNotFoundException;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import leyans.RidersHub.DTO.Response.ActiveRideDTO;
import leyans.RidersHub.DTO.Response.RideDetailDTO;
import leyans.RidersHub.DTO.Response.RideResponseDTO;
import leyans.RidersHub.DTO.Response.RideSummaryDTO;
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
import java.util.UUID;
import java.util.stream.Collectors;

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

    public ActiveRideDTO mapToActiveDTO(Rides ride, Integer startedRideId) {
        List<StopPointDTO> stopDTOs = ride.getStopPoints().stream()
                .map(sp -> new StopPointDTO(
                        sp.getStopName(),
                        sp.getStopLocation().getX(),
                        sp.getStopLocation().getY()
                ))
                .collect(Collectors.toList());

        return new ActiveRideDTO(
                startedRideId,  // ← Add this from StartedRide
                ride.getGeneratedRidesId(),
                ride.getRidesName(),
                ride.getLocationName(),
                ride.getRiderType().getRiderType(),
                ride.getDistance(),
                ride.getDate(),
                ride.getLocation().getY(),
                ride.getLocation().getX(),
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
                ride.getParticipants().stream()
                        .map(r -> r.getUsername())
                        .collect(Collectors.toList()),
                ride.getDescription(),
                ride.getActive(),
                ride.getRouteCoordinates(),
                stopDTOs
        );
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
    public List<StopPointDTO> getStopPointsDTOByGeneratedRideId(String generatedRidesId) {
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
    public String getRideMapImageUrlById(String generatedRidesId) {
        Rides ride = findRideEntityByGeneratedId(generatedRidesId);
        return ride.getMapImageUrl();
    }

    @Transactional(readOnly = true)
    public RideDetailDTO findRideByGeneratedId(String generatedRidesId) {
        Rides ride = ridesRepository.findByGeneratedRidesIdWithDetails(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Ride not found with ID: " + generatedRidesId));
        return mapToDetailDTO(ride);                    // ← detail mapper
    }

    @Transactional(readOnly = true)
    public Page<RideSummaryDTO> findRidesByUsernamePaginated(String username, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Rides> ridesPage = ridesRepository.findByUsername_UsernamePaginated(username, pageable);
        return ridesPage.map(this::mapToSummaryDTO);    // ← summary mapper
    }

    @Transactional(readOnly = true)
    public Page<RideSummaryDTO> getPaginatedRides(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Rides> ridesPage = ridesRepository.findAllActiveSummary(pageable);
        return ridesPage.map(this::mapToSummaryDTO);    // ← summary mapper
    }

    @Transactional
    public Rides findRideEntityByGeneratedId(String generatedRidesId) {
        return ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Ride not found with ID: " + generatedRidesId));
    }


    // ─── Summary mapper — used by paginated list endpoints ───────────────────────
    public RideSummaryDTO mapToSummaryDTO(Rides ride) {
        return new RideSummaryDTO(
                ride.getGeneratedRidesId(),
                ride.getRidesName(),
                ride.getLocationName(),
                ride.getRiderType().getRiderType(),
                ride.getDistance(),
                ride.getDate(),
                ride.getLocation().getY(),          // latitude  = Y
                ride.getLocation().getX(),          // longitude = X
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
                ride.getParticipants().stream()
                        .map(r -> r.getUsername())
                        .collect(Collectors.toList()),
                ride.getDescription(),
                ride.getActive()
        );
    }

    // ─── Detail mapper — used by single-ride fetch only ──────────────────────────
    public RideDetailDTO mapToDetailDTO(Rides ride) {
        List<StopPointDTO> stopDTOs = ride.getStopPoints().stream()
                .map(sp -> new StopPointDTO(
                        sp.getStopName(),
                        sp.getStopLocation().getX(),
                        sp.getStopLocation().getY()
                ))
                .collect(Collectors.toList());

        return new RideDetailDTO(
                ride.getGeneratedRidesId(),
                ride.getRidesName(),
                ride.getLocationName(),
                ride.getRiderType().getRiderType(),
                ride.getDistance(),
                ride.getDate(),
                ride.getLocation().getY(),
                ride.getLocation().getX(),
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
                ride.getParticipants().stream()
                        .map(r -> r.getUsername())
                        .collect(Collectors.toList()),
                ride.getDescription(),
                ride.getActive(),
                // detail-only
                ride.getRouteCoordinates(),
                stopDTOs
        );
    }

    public List<StopPointDTO> mapStopPointsToDTOs(List<StopPoint> stopPoints) {
        return stopPoints.stream()
                .map(stopPoint -> new StopPointDTO(
                        stopPoint.getStopName(),
                        stopPoint.getStopLocation().getX(),
                        stopPoint.getStopLocation().getY()
                ))
                .toList();
    }

    public Rides validateAndGetRide(String generatedRidesId, Rider initiator) throws AccessDeniedException {
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

        // Check if the initiator already has an ongoing ride (either as owner or participant)
        // Option A: Check if they're the owner
        if (startedRideRepository.existsByUsername(initiator)) {
            throw new IllegalStateException("You already have a ride in progress");
        }

        // Option B: Also check if they're a participant in an active ride (optional)
        // You'd need another repository method for this

        return ride;
    }


    public String generateUniqueRideId() {
        return UUID.randomUUID().toString()
                .replace("-", "")           // Remove hyphens
                .substring(0, 12)           // Take first 12 characters (48 bits = ~281 trillion combinations)
                .toUpperCase();             // Make human-readable
    }



}
