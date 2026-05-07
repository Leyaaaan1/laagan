package leyans.RidersHub.model;

import jakarta.persistence.*;
import org.hibernate.annotations.NaturalId;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rider")
public class Rider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @NaturalId
    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "rider_rider_types",
            joinColumns = @JoinColumn(name = "rider_id"),
            inverseJoinColumns = @JoinColumn(name = "rider_type_id")
    )
    private List<RiderType> riderTypes = new ArrayList<>();

    @Column(name = "about", length = 500, nullable = true)
    private String about;

    public Rider(Integer id, String username, String password, Boolean enabled, List<RiderType> riderTypes, String about) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.enabled = enabled;
        this.riderTypes = riderTypes;
        this.about = about;
    }

    public Rider() {
    }

    public interface RiderUsernameProjection {
        String getUsername();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public List<RiderType> getRiderTypes() {
        return riderTypes;
    }

    public void setRiderTypes(List<RiderType> riderTypes) {
        this.riderTypes = riderTypes;
    }

    public String getAbout() {
        return about;
    }

    public void setAbout(String about) {
        this.about = about;
    }
}