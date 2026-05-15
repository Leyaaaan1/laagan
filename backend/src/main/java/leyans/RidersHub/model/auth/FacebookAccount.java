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


    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "facebook_id", nullable = false, unique = true)
    private String facebookId;

    @Column(name = "email", nullable = true)
    private String email;

    @OneToOne
    @JoinColumn(name = "rider_id", referencedColumnName = "id")
    private Rider rider;

    public FacebookAccount() {
    }


    public FacebookAccount(Integer id, String profilePictureUrl, String facebookId, String email, Rider rider) {
        this.id = id;
        this.profilePictureUrl = profilePictureUrl;
        this.facebookId = facebookId;
        this.email = email;
        this.rider = rider;
    }

    public String getFacebookId() {
        return facebookId;
    }

    public void setFacebookId(String facebookId) {
        this.facebookId = facebookId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

