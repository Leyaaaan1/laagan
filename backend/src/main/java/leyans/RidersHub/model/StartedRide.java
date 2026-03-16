package leyans.RidersHub.model;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "started_rides")
public class StartedRide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "initiator_username", referencedColumnName = "username", nullable = false)
    private Rider username;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rides_id", referencedColumnName = "generatedRidesId", nullable = false)
    private Rides ride;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;




    @Column(name = "location", columnDefinition = "geometry(Point,4326)")
    private Point location;





    @ManyToMany
    @JoinTable(
            name = "started_ride_participants",
            joinColumns = @JoinColumn(name = "started_ride_id"),
            inverseJoinColumns = @JoinColumn(name = "rider_username")
    )
    @JsonIgnore
    private List<Rider> participants = new ArrayList<>();
    // Constructors
    public StartedRide() {}

    public StartedRide(Rides ride, LocalDateTime startTime, Point location, List<Rider> participants, Rider username) {
        this.ride = ride;
        this.startTime = startTime;
        this.location = location;
        this.participants = participants != null ? new ArrayList<>(participants) : new ArrayList<>();
        this.username = username;
    }




    public Rider getUsername() {
        return username;
    }

    public void setUsername(Rider username) {
        this.username = username;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }

    public List<Rider> getParticipants() {
        return participants;
    }

    public void setParticipants(List<Rider> participants) {
        this.participants = participants;
    }

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Rides getRide() {
        return ride;
    }

    public void setRide(Rides ride) {
        this.ride = ride;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
}
