package leyans.RidersHub.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ride_join_requests")
public class RideJoinRequest {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "generatedRidesId", referencedColumnName = "generatedRidesId", nullable = false)
    private Rides generatedRidesId;

    @ManyToOne
    @JoinColumn(name = "rider_id", nullable = false)
    private Rider rider;


    public RideJoinRequest() {

    }
    public RideJoinRequest(Integer id, Rider rider, Rides generatedRidesId) {
        this.id = id;
        this.rider = rider;
        this.generatedRidesId = generatedRidesId;
    }


    public Rides getGeneratedRidesId() {
        return generatedRidesId;
    }

    public void setGeneratedRidesId(Rides generatedRidesId) {
        this.generatedRidesId = generatedRidesId;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Rider getRider() {
        return rider;
    }

    public void setRider(Rider rider) {
        this.rider = rider;
    }





}
