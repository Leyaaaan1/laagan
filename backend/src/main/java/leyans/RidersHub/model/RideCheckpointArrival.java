package leyans.RidersHub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ride_checkpoint_arrivals",
        indexes = {
                @Index(name = "idx_checkpoint_started_ride", columnList = "started_ride_id"),
                @Index(name = "idx_checkpoint_rider", columnList = "rider_username"),
                @Index(name = "idx_checkpoint_type", columnList = "checkpoint_type")
        }
)
public class RideCheckpointArrival {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "started_ride_id", referencedColumnName = "rides_id", nullable = false)
    private StartedRide startedRide;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rider_username", referencedColumnName = "username", nullable = false)
    private Rider rider;

    @Enumerated(EnumType.STRING)
    @Column(name = "checkpoint_type", nullable = false)
    private CheckpointType checkpointType; // STOP_POINT or ENDING

    // Which stop point index (0-based, matches stopPoints list in Rides)
    // null when checkpointType = ENDING
    @Column(name = "checkpoint_index")
    private Integer checkpointIndex;

    @Column(name = "arrived_at", nullable = false)
    private LocalDateTime arrivedAt;

    public enum CheckpointType {
        STOP_POINT,
        ENDING
    }

    public RideCheckpointArrival() {}

    public RideCheckpointArrival(StartedRide startedRide, Rider rider,
                                 CheckpointType checkpointType,
                                 Integer checkpointIndex,
                                 LocalDateTime arrivedAt) {
        this.startedRide = startedRide;
        this.rider = rider;
        this.checkpointType = checkpointType;
        this.checkpointIndex = checkpointIndex;
        this.arrivedAt = arrivedAt;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public StartedRide getStartedRide() { return startedRide; }
    public void setStartedRide(StartedRide startedRide) { this.startedRide = startedRide; }

    public Rider getRider() { return rider; }
    public void setRider(Rider rider) { this.rider = rider; }

    public CheckpointType getCheckpointType() { return checkpointType; }
    public void setCheckpointType(CheckpointType checkpointType) { this.checkpointType = checkpointType; }

    public Integer getCheckpointIndex() { return checkpointIndex; }
    public void setCheckpointIndex(Integer checkpointIndex) { this.checkpointIndex = checkpointIndex; }

    public LocalDateTime getArrivedAt() { return arrivedAt; }
    public void setArrivedAt(LocalDateTime arrivedAt) { this.arrivedAt = arrivedAt; }
}