package leyans.RidersHub.model.participant;


import jakarta.persistence.*;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.StartedRide;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;

@Entity
@Table(name = "participant_location")
public class ParticipantLocation {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  Integer participantLocationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "started_ride_id", nullable = false)
    private StartedRide startedRide;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rider_username", referencedColumnName = "username", nullable = false)
    private Rider rider;

    @Column(name = "participant_location", columnDefinition = "geometry(Point,4326)")
    private Point participantLocation;

    @Column(name = "last_update", nullable = false)
    private LocalDateTime lastUpdate;

    public ParticipantLocation( StartedRide startedRide, Rider rider, Point participantLocation, LocalDateTime lastUpdate) {
        this.startedRide = startedRide;
        this.rider = rider;
        this.participantLocation = participantLocation;
        this.lastUpdate = lastUpdate;
    }
    public ParticipantLocation() {
    }

    public Integer getParticipantLocationId() {
        return participantLocationId;
    }

    public void setParticipantLocationId(Integer participantLocationId) {
        this.participantLocationId = participantLocationId;
    }

    public StartedRide getStartedRide() {
        return startedRide;
    }

    public void setStartedRide(StartedRide startedRide) {
        this.startedRide = startedRide;
    }

    public Rider getRider() {
        return rider;
    }

    public void setRider(Rider rider) {
        this.rider = rider;
    }

    public Point getParticipantLocation() {
        return participantLocation;
    }

    public void setParticipantLocation(Point participantLocation) {
        this.participantLocation = participantLocation;
    }

    public LocalDateTime getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(LocalDateTime lastUpdate) {
        this.lastUpdate = lastUpdate;
    }
}
