package leyans.RidersHub.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "event_rides",
        indexes = {
                @Index(name = "idx_generated_rides_id", columnList = "generatedRidesId"),
                @Index(name = "idx_rides_username_date", columnList = "username, ride_date, active"),
                @Index(name = "idx_rides_date", columnList = "ride_date"),
                @Index(name = "idx_rides_active", columnList = "active")
        }
)
public class Rides {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ridesId", nullable  = false)
    private Integer ridesId;

    @Column(name = "generatedRidesId", nullable = false, unique = true)
    private Integer generatedRidesId;


    @Column(name = "locationName", nullable = false)
    private String locationName;

    @Column(name = "ridesName", nullable = false)
    private String ridesName;

    @Lob
    @Column(name = "description")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "username", referencedColumnName = "username", nullable = false)
    private Rider username;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rider_type", referencedColumnName = "rider_type", nullable = false)
    private RiderType riderType;

    @Column(name = "distance")
    private Integer distance;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "ride_participants",
            joinColumns = @JoinColumn(name = "ride_id"),
            inverseJoinColumns = @JoinColumn(name = "rider_username")
    )
    private Set<Rider> participants = new HashSet<>();

    @Column(name = "startingLocation", columnDefinition = "geometry(Point,4326)")
    private Point startingLocation;
    @Column(name = "endingLocation", columnDefinition = "geometry(Point,4326)")
    private Point endingLocation;


    @Column(name = "startingPointName", nullable = false)
    private String startingPointName;

    @Column(name = "endingPointName", nullable = false)
    private String endingPointName;


    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "ride_stop_points", joinColumns = @JoinColumn(name = "ride_id"))
    private List<StopPoint> stopPoints = new ArrayList<>();

    @Column(name = "ride_date", nullable = false)
    private LocalDateTime date;

    @Column(name = "location", columnDefinition = "geometry(Point,4326)")
    private Point location;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "map_image_url", length = 500)
    private String mapImageUrl;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "map_starting_url", length = 500)
    private String magImageStartingLocation;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "map_ending_url", length = 500)
    private String magImageEndingLocation;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "route_coordinates", columnDefinition = "TEXT")
    private String routeCoordinates;

    @Column(name = "active")
    private Boolean active;




    public Rides() {
    }

    public Rides(Integer generatedRidesId, String locationName, String startingPointName,
                 String endingPointName, Point location, Point startingLocation,
                 Point endingLocation, String ridesName, String description,
                 Rider username, RiderType riderType, Integer distance, LocalDateTime date,
                 String mapImageUrl,
                 String magImageStartingLocation, String magImageEndingLocation,
                 String routeCoordinates, Boolean active) {
        this.generatedRidesId = generatedRidesId;
        this.locationName = locationName;
        this.ridesName = ridesName;
        this.location = location;
        this.username = username;
        this.riderType = riderType;
        this.distance = distance;

        this.date = date;
        this.description = description;
        this.startingLocation = startingLocation;
        this.endingLocation = endingLocation;
        this.startingPointName = startingPointName;
        this.endingPointName = endingPointName;
        this.mapImageUrl = mapImageUrl;
        this.magImageStartingLocation = magImageStartingLocation;
        this.magImageEndingLocation = magImageEndingLocation;
        this.routeCoordinates = routeCoordinates;
        this.active = active;

    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getRouteCoordinates() {
        return routeCoordinates;
    }

    public void setRouteCoordinates(String routeCoordinates) {
        this.routeCoordinates = routeCoordinates;
    }

    public List<StopPoint> getStopPoints() {
        return stopPoints;
    }

    public void setStopPoints(List<StopPoint> stopPoints) {
        this.stopPoints = stopPoints;
    }

    public String getMagImageStartingLocation() {
        return magImageStartingLocation;
    }

    public void setMagImageStartingLocation(String magImageStartingLocation) {
        this.magImageStartingLocation = magImageStartingLocation;
    }

    public String getMagImageEndingLocation() {
        return magImageEndingLocation;
    }

    public void setMagImageEndingLocation(String magImageEndingLocation) {
        this.magImageEndingLocation = magImageEndingLocation;
    }

    public Integer getGeneratedRidesId() {
        return generatedRidesId;
    }

    public void setGeneratedRidesId(Integer generatedRidesId) {
        this.generatedRidesId = generatedRidesId;
    }

    public String getMapImageUrl() {
        return mapImageUrl;
    }

    public void setMapImageUrl(String mapImageUrl) {
        this.mapImageUrl = mapImageUrl;
    }

    public String getStartingPointName() {
        return startingPointName;
    }

    public void setStartingPointName(String startingPointName) {
        this.startingPointName = startingPointName;
    }

    public String getEndingPointName() {
        return endingPointName;
    }

    public void setEndingPointName(String endingPointName) {
        this.endingPointName = endingPointName;
    }

    public Point getStartingLocation() {
        return startingLocation;
    }

    public void setStartingLocation(Point startingLocation) {
        this.startingLocation = startingLocation;
    }

    public Point getEndingLocation() {
        return endingLocation;
    }

    public void setEndingLocation(Point endingLocation) {
        this.endingLocation = endingLocation;
    }


    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }

    public Set<Rider> getParticipants() {
        return participants;
    }

    public void setParticipants(Set<Rider> participants) {
        this.participants = participants;
    }

    public void addParticipant(Rider participant) {
        this.participants.add(participant);
    }

    public void removeParticipant(Rider participant) {
        this.participants.remove(participant);
    }
    public Integer getRidesId() {
        return ridesId;
    }

    public void setRidesId(Integer ridesId) {
        this.ridesId = ridesId;
    }




    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getRidesName() {
        return ridesName;
    }

    public void setRidesName(String ridesName) {
        this.ridesName = ridesName;
    }

    public Rider getUsername() {
        return username;
    }

    public void setUsername(Rider username) {
        this.username = username;
    }

    public RiderType getRiderType() {
        return riderType;
    }

    public void setRiderType(RiderType riderType) {
        this.riderType = riderType;
    }

    public Integer getDistance() {
        return distance;
    }

    public void setDistance(Integer distance) {
        this.distance = distance;
    }



    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }
}
