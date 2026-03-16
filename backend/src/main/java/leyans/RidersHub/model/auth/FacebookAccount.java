package leyans.RidersHub.model.auth;

import jakarta.persistence.*;
import leyans.RidersHub.model.Rider;

@Entity
@Table(name = "facebook_account")
public class FacebookAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @OneToOne
    @JoinColumn(name = "rider_id", referencedColumnName = "id")
    private Rider rider;

    public FacebookAccount() {
    }

    public FacebookAccount(Integer id, String username, String password, String profilePictureUrl, Rider rider) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.profilePictureUrl = profilePictureUrl;
        this.rider = rider;
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

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public Rider getRider() {
        return rider;
    }

    public void setRider(Rider rider) {
        this.rider = rider;
    }
}

