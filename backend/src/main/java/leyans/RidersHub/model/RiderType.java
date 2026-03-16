package leyans.RidersHub.model;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.*;

@Entity
@Table(name = "rider_type")
public class RiderType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rider_type_id")
    private Integer riderTypeId;


    @Column(name = "rider_type", nullable = false, unique = true)
    private String riderType;


    @OneToMany(mappedBy = "riderType", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Rider> riders;

    public RiderType(Integer riderTypeId, String riderType) {
        this.riderTypeId = riderTypeId;
        this.riderType = riderType;
    }

    public RiderType() {

    }


    // Getters and Setters

    public String getRiderType() {
        return riderType;
    }

    public void setRiderType(String riderType) {
        this.riderType = riderType;
    }
}
