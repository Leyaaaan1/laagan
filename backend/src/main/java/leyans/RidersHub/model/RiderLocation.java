package leyans.RidersHub.model;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;
import java.time.LocalDateTime;

import java.awt.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rider_locations")
public class RiderLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "rider_username", referencedColumnName = "username", nullable = false)
    private Rider username;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "started_ride_id", referencedColumnName = "id", nullable = false)
    private StartedRide startedRide;


    @Column(name = "locationName", nullable = false)
    private String locationName;

    @Column(name = "location", columnDefinition = "geometry(Point,4326)", nullable = false)
    private Point location;

    @Column(name = "distance_meters")
    private double distanceMeters;


    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    public RiderLocation(Integer id, Rider username, double distanceMeters, StartedRide startedRide, String locationName, Point location, LocalDateTime timestamp) {
        this.id = id;
        this.username = username;
        this.startedRide = startedRide;
        this.location = location;
        this.timestamp = timestamp;
        this.distanceMeters = distanceMeters;
        this.locationName = locationName;
    }

    public RiderLocation() {

    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public Rider getUsername() {
        return username;
    }

    public void setUsername(Rider username) {
        this.username = username;
    }

    public double getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(double distanceMeters) {
        this.distanceMeters = distanceMeters;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public StartedRide getStartedRide() {
        return startedRide;
    }

    public void setStartedRide(StartedRide startedRide) {
        this.startedRide = startedRide;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
