package leyans.RidersHub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Audit log of every status transition for a ride.
 *
 * <p>Two scopes:
 * <ul>
 *   <li>{@code RIDE}  – aggregate transition (INACTIVE → STARTED → FINISHED / STOPPED).</li>
 *   <li>{@code RIDER} – individual rider reached their ending checkpoint (RIDER_FINISHED).</li>
 * </ul>
 *
 * <p>One row is inserted per transition; rows are never updated, giving a full
 * history of the ride lifecycle.
 */
@Entity
@Table(
        name = "ride_status_entries",
        indexes = {
                @Index(name = "idx_rse_generated_rides_id",  columnList = "generated_rides_id"),
                @Index(name = "idx_rse_rider_username",      columnList = "rider_username"),
                @Index(name = "idx_rse_status",              columnList = "status"),
                @Index(name = "idx_rse_scope",               columnList = "scope"),
                @Index(name = "idx_rse_generated_status",    columnList = "generated_rides_id, status")
        }
)
public class RideStatusEntry {

    // ── Scope ────────────────────────────────────────────────────────────────

    public enum Scope {
        RIDE,
        RIDER
    }

    // ── Fields ───────────────────────────────────────────────────────────────

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    @Column(name = "generated_rides_id", nullable = false, length = 12)
    private String generatedRidesId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RideStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 10)
    private Scope scope;

    @Column(name = "rider_username", length = 50)
    private String riderUsername;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "changed_at", nullable = false, updatable = false)
    private LocalDateTime changedAt = LocalDateTime.now();

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    // ── Constructors ─────────────────────────────────────────────────────────

    protected RideStatusEntry() {}

    /** Convenience constructor for aggregate (RIDE-scope) transitions. */
    public RideStatusEntry(String generatedRidesId, RideStatus status) {
        this.generatedRidesId = generatedRidesId;
        this.status           = status;
        this.scope            = Scope.RIDE;
        this.active           = true;
        this.changedAt        = LocalDateTime.now();
    }

    /** Convenience constructor for aggregate transitions with a note. */
    public RideStatusEntry(String generatedRidesId, RideStatus status, String note) {
        this(generatedRidesId, status);
        this.note = note;
    }

    /** Convenience constructor for per-rider (RIDER-scope) transitions. */
    public RideStatusEntry(String generatedRidesId, RideStatus status, String riderUsername, String note) {
        this.generatedRidesId = generatedRidesId;
        this.status           = status;
        this.scope            = Scope.RIDER;
        this.riderUsername    = riderUsername;
        this.active           = true;
        this.changedAt        = LocalDateTime.now();
        this.note             = note;
    }

    // ── Getters / Setters ────────────────────────────────────────────────────

    public Integer getId()                     { return id; }

    public String getGeneratedRidesId()        { return generatedRidesId; }
    public void setGeneratedRidesId(String v)  { this.generatedRidesId = v; }

    public RideStatus getStatus()              { return status; }
    public void setStatus(RideStatus v)        { this.status = v; }

    public Scope getScope()                    { return scope; }
    public void setScope(Scope v)              { this.scope = v; }

    public String getRiderUsername()           { return riderUsername; }
    public void setRiderUsername(String v)     { this.riderUsername = v; }

    public boolean isActive()                  { return active; }
    public void setActive(boolean v)           { this.active = v; }

    public LocalDateTime getChangedAt()        { return changedAt; }
    public void setChangedAt(LocalDateTime v)  { this.changedAt = v; }

    public String getNote()                    { return note; }
    public void setNote(String v)              { this.note = v; }
}