package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Response.RideStatusDTO;
import leyans.RidersHub.DTO.Response.RideStatusDTO.HistoryEntryDTO;
import leyans.RidersHub.DTO.Response.RideStatusDTO.RiderStatusDTO;
import leyans.RidersHub.Repository.RideStatusRepository;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.model.RideStatus;
import leyans.RidersHub.model.RideStatusEntry;
import leyans.RidersHub.model.RideStatusEntry.Scope;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;


@Service
public class RideStatusService {

    private final RideStatusRepository rideStatusRepository;

    public RideStatusService(RideStatusRepository rideStatusRepository) {
        this.rideStatusRepository = rideStatusRepository;
    }

    @Transactional
    public void markInactive(String generatedRidesId) {
        AppLogger.info(this.getClass(), "markInactive called", "rideId", generatedRidesId);
        recordRideStatus(generatedRidesId, RideStatus.INACTIVE, "Ride created");
    }


    @Transactional
    public void markStarted(String generatedRidesId) {
        AppLogger.info(this.getClass(), "markStarted called", "rideId", generatedRidesId);
        recordRideStatus(generatedRidesId, RideStatus.STARTED, "Ride started by creator");
    }


    @Transactional
    public void markFinished(String generatedRidesId, String note) {
        AppLogger.info(this.getClass(), "markFinished called", "rideId", generatedRidesId, "note", note);
        recordRideStatus(generatedRidesId, RideStatus.FINISHED,
                note != null ? note : "Ride finished");
    }


    @Transactional
    public RideStatusEntry markStopped(String generatedRidesId) {
        AppLogger.info(this.getClass(), "ride marked as STOPPED", "rideId", generatedRidesId);
        return recordRideStatus(generatedRidesId, RideStatus.STOPPED,
                "Ride deactivated by creator");


    }


    @Transactional
    public void markRiderFinished(String generatedRidesId, String riderUsername) {
        AppLogger.info(this.getClass(), "markRiderFinished called",
                "rideId", generatedRidesId, "rider", riderUsername);

        // Idempotency guard
        if (rideStatusRepository.existsByGeneratedRidesIdAndRiderUsernameAndStatus(
                generatedRidesId, riderUsername, RideStatus.RIDER_FINISHED)) {
            AppLogger.info(this.getClass(), "RIDER_FINISHED already recorded — skipping",
                    "rideId", generatedRidesId, "rider", riderUsername);
            rideStatusRepository
                    .findCurrentRiderStatus(generatedRidesId, riderUsername)
                    .orElseThrow();
            return;
        }

        rideStatusRepository.deactivatePreviousRiderEntries(generatedRidesId, riderUsername);

        RideStatusEntry entry = new RideStatusEntry(
                generatedRidesId,
                RideStatus.RIDER_FINISHED,
                riderUsername,
                "Rider reached ending checkpoint"
        );

        RideStatusEntry saved = rideStatusRepository.save(entry);
        AppLogger.info(this.getClass(), "RIDER_FINISHED recorded",
                "rideId", generatedRidesId, "rider", riderUsername);
    }


    @Transactional(readOnly = true)
    public RideStatusDTO getCurrentStatus(String generatedRidesId, boolean active) {
        AppLogger.info(this.getClass(), "getCurrentStatus called", "rideId", generatedRidesId);

        return rideStatusRepository
                .findCurrentRideStatus(generatedRidesId)
                .map(e -> new RideStatusDTO(
                        generatedRidesId,
                        e.getStatus(),
                        active,
                        e.getChangedAt()))
                .orElse(new RideStatusDTO(
                        generatedRidesId,
                        RideStatus.INACTIVE,
                        active,
                        null));
    }


    @Transactional(readOnly = true)
    public RideStatusDTO getDetailedStatus(String generatedRidesId, boolean active) {
        AppLogger.info(this.getClass(), "getDetailedStatus called", "rideId", generatedRidesId);

        RideStatusDTO dto = getCurrentStatus(generatedRidesId, active);

        // Per-rider active entries
        List<RiderStatusDTO> riderStatuses = rideStatusRepository
                .findByGeneratedRidesIdOrderByChangedAtDesc(generatedRidesId)
                .stream()
                .filter(e -> e.getScope() == Scope.RIDER && e.isActive())
                .map(e -> new RiderStatusDTO(
                        e.getRiderUsername(),
                        e.getStatus(),
                        e.getChangedAt()))
                .collect(Collectors.toList());

        dto.setRiderStatuses(riderStatuses);
        return dto;
    }


    @Transactional(readOnly = true)
    public RideStatusDTO getStatusHistory(String generatedRidesId, boolean active) {
        AppLogger.info(this.getClass(), "getStatusHistory called", "rideId", generatedRidesId);

        RideStatusDTO dto = getCurrentStatus(generatedRidesId, active);

        List<HistoryEntryDTO> history = rideStatusRepository
                .findByGeneratedRidesIdOrderByChangedAtDesc(generatedRidesId)
                .stream()
                .map(e -> new HistoryEntryDTO(
                        e.getId(),
                        e.getScope(),
                        e.getStatus(),
                        e.getRiderUsername(),
                        e.isActive(),
                        e.getChangedAt(),
                        e.getNote()))
                .collect(Collectors.toList());

        dto.setHistory(history);
        return dto;
    }


    @Transactional(readOnly = true)
    public long countRiderFinished(String generatedRidesId) {
        return rideStatusRepository.countRiderFinished(generatedRidesId);
    }


    private RideStatusEntry recordRideStatus(String generatedRidesId,
                                             RideStatus status,
                                             String note) {
        AppLogger.info(this.getClass(), "Recording ride status",
                "rideId", generatedRidesId, "status", status);

        rideStatusRepository.deactivatePreviousRideEntries(generatedRidesId);

        RideStatusEntry entry = new RideStatusEntry(generatedRidesId, status, note);
        RideStatusEntry saved = rideStatusRepository.save(entry);

        AppLogger.info(this.getClass(), "Ride status recorded",
                "rideId", generatedRidesId, "status", status, "entryId", saved.getId());
        return saved;
    }
}