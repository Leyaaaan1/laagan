package leyans.RidersHub.model;


import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "finished_rides",
        indexes = {
                @Index(name = "idx_finished_ride_generated_id", columnList = "generated_rides_id"),
                @Index(name = "idx_finished_ride_finisher", columnList = "finisher_username")
        }
)
public class FinishedRide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "started_ride_id", referencedColumnName = "id", nullable = false)
    private StartedRide startedRide;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "generated_rides_id", referencedColumnName = "generated_rides_id", nullable = false)
    private Rides ride;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finisher_username", referencedColumnName = "username", nullable = false)
    private Rider finishedBy; // always the ride creator

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime; // copied from StartedRide

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes; // computed: endTime - startTime

    @ManyToMany
    @JoinTable(
            name = "finished_ride_participants",
            joinColumns = @JoinColumn(name = "finished_ride_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "rider_username", referencedColumnName = "username")
    )
    private Set<Rider> completedParticipants = new HashSet<>(); // who was still in the ride at finish

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public FinishedRide() {}


    public FinishedRide(StartedRide startedRide, Rides ride, Rider finishedBy,
                        LocalDateTime startTime, LocalDateTime endTime,
                        Integer durationMinutes, Set<Rider> completedParticipants) {
        this.startedRide = startedRide;
        this.ride = ride;
        this.finishedBy = finishedBy;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
        this.completedParticipants = completedParticipants;
    }
    public StartedRide getStartedRide() {
        return startedRide;
    }

    public void setStartedRide(StartedRide startedRide) {
        this.startedRide = startedRide;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Rides getRide() { return ride; }
    public void setRide(Rides ride) { this.ride = ride; }

    public Rider getFinishedBy() { return finishedBy; }
    public void setFinishedBy(Rider finishedBy) { this.finishedBy = finishedBy; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Set<Rider> getCompletedParticipants() { return completedParticipants; }
    public void setCompletedParticipants(Set<Rider> completedParticipants) { this.completedParticipants = completedParticipants; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}