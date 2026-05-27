package leyans.RidersHub.DTO.Response;

import leyans.RidersHub.model.RideStatus;
import leyans.RidersHub.model.RideStatusEntry.Scope;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response payload for ride-status endpoints.
 */
public class RideStatusDTO {

    // ── Aggregate status ──────────────────────────────────────────────────────

    private String      generatedRidesId;
    private RideStatus  currentStatus;       // aggregate: INACTIVE / STARTED / FINISHED / STOPPED
    private boolean     active;              // mirrors Rides.active
    private LocalDateTime statusChangedAt;

    // ── Per-rider statuses (populated for detail endpoints) ───────────────────

    private List<RiderStatusDTO> riderStatuses;

    // ── History (populated only when requested) ───────────────────────────────

    private List<HistoryEntryDTO> history;

    // ── Inner DTOs ─────────────────────────────────────────────────────────────

    public record RiderStatusDTO(
            String         riderUsername,
            RideStatus     status,          // STARTED or RIDER_FINISHED
            LocalDateTime  changedAt
    ) {}

    public record HistoryEntryDTO(
            Integer        id,
            Scope          scope,
            RideStatus     status,
            String         riderUsername,   // null for RIDE scope
            boolean        active,
            LocalDateTime  changedAt,
            String         note
    ) {}

    // ── Constructors ──────────────────────────────────────────────────────────

    public RideStatusDTO() {}

    public RideStatusDTO(String generatedRidesId,
                         RideStatus currentStatus,
                         boolean active,
                         LocalDateTime statusChangedAt) {
        this.generatedRidesId = generatedRidesId;
        this.currentStatus    = currentStatus;
        this.active           = active;
        this.statusChangedAt  = statusChangedAt;
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public String getGeneratedRidesId()              { return generatedRidesId; }
    public void   setGeneratedRidesId(String v)      { this.generatedRidesId = v; }

    public RideStatus getCurrentStatus()             { return currentStatus; }
    public void       setCurrentStatus(RideStatus v) { this.currentStatus = v; }

    public boolean isActive()                        { return active; }
    public void    setActive(boolean v)              { this.active = v; }

    public LocalDateTime getStatusChangedAt()           { return statusChangedAt; }
    public void          setStatusChangedAt(LocalDateTime v) { this.statusChangedAt = v; }

    public List<RiderStatusDTO> getRiderStatuses()               { return riderStatuses; }
    public void                 setRiderStatuses(List<RiderStatusDTO> v) { this.riderStatuses = v; }

    public List<HistoryEntryDTO> getHistory()                    { return history; }
    public void                  setHistory(List<HistoryEntryDTO> v)     { this.history = v; }
}