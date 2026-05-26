package leyans.RidersHub.model.FinishedRide;


import jakarta.persistence.*;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "personal_finished_rides",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_personal_finished_ride",
                        columnNames = {"generated_rides_id", "rider_username"}
                )
        },
        indexes = {
                @Index(name = "idx_personal_finished_ride_generated_id", columnList = "generated_rides_id"),
                @Index(name = "idx_personal_finished_ride_rider", columnList = "rider_username")
        }
)
public class PersonalFinishedRide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // FK to permanent Rides entity — never deleted
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "generated_rides_id", referencedColumnName = "generated_rides_id", nullable = false)
    private Rides ride;

    // The rider who completed their personal ride
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rider_username", referencedColumnName = "username", nullable = false)
    private Rider rider;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime; // copied from StartedRide

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime; // when they hit ENDING checkpoint

    @Column(name = "duration_minutes")
    private Integer durationMinutes; // endTime - startTime

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public PersonalFinishedRide() {}

    public PersonalFinishedRide(Rides ride, Rider rider,
                                LocalDateTime startTime, LocalDateTime endTime,
                                Integer durationMinutes) {
        this.ride = ride;
        this.rider = rider;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Rides getRide() { return ride; }
    public void setRide(Rides ride) { this.ride = ride; }

    public Rider getRider() { return rider; }
    public void setRider(Rider rider) { this.rider = rider; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}