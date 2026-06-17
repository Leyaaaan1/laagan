package leyans.RidersHub.model.participant;

import jakarta.persistence.*;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;

import java.time.LocalDateTime;

@Entity
@Table(name = "ride_checkpoint_arrivals",
        indexes = {
                @Index(name = "idx_checkpoint_generated_ride", columnList = "generated_rides_id"),
                @Index(name = "idx_checkpoint_rider", columnList = "rider_username"),
                @Index(name = "idx_checkpoint_type", columnList = "checkpoint_type")
        }
)
public class RideCheckpointArrival {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // FK to Rides (the permanent event) — not StartedRide, which gets deleted after finish
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "generated_rides_id", referencedColumnName = "generated_rides_id", nullable = false)
    private Rides ride;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rider_username", referencedColumnName = "username", nullable = false)
    private Rider rider;

    @Enumerated(EnumType.STRING)
    @Column(name = "checkpoint_type", nullable = false)
    private CheckpointType checkpointType;

    @Column(name = "checkpoint_index")
    private Integer checkpointIndex;

    @Column(name = "arrived_at", nullable = false)
    private LocalDateTime arrivedAt;

    public enum CheckpointType {
        STARTING_POINT,
        STOP_POINT,
        ENDING
    }

    public RideCheckpointArrival() {}

    public RideCheckpointArrival(Rides ride, Rider rider,
                                 CheckpointType checkpointType,
                                 Integer checkpointIndex,
                                 LocalDateTime arrivedAt) {
        this.ride = ride;
        this.rider = rider;
        this.checkpointType = checkpointType;
        this.checkpointIndex = checkpointIndex;
        this.arrivedAt = arrivedAt;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Rides getRide() { return ride; }
    public void setRide(Rides ride) { this.ride = ride; }

    public Rider getRider() { return rider; }
    public void setRider(Rider rider) { this.rider = rider; }

    public CheckpointType getCheckpointType() { return checkpointType; }
    public void setCheckpointType(CheckpointType checkpointType) { this.checkpointType = checkpointType; }

    public Integer getCheckpointIndex() { return checkpointIndex; }
    public void setCheckpointIndex(Integer checkpointIndex) { this.checkpointIndex = checkpointIndex; }

    public LocalDateTime getArrivedAt() { return arrivedAt; }
    public void setArrivedAt(LocalDateTime arrivedAt) { this.arrivedAt = arrivedAt; }
}