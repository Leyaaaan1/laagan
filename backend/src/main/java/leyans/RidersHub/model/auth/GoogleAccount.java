package leyans.RidersHub.model.auth;

import jakarta.persistence.*;
import leyans.RidersHub.model.Rider;

@Entity
@Table(name = "google_account")
public class GoogleAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "google_id", nullable = false, unique = true)
    private String googleId;        // Google's unique user ID (payload.getSubject())

    @Column(name = "email", nullable = true)
    private String email;

    @Column(name = "profile_picture_url", nullable = true)
    private String profilePictureUrl;

    @OneToOne
    @JoinColumn(name = "rider_id", referencedColumnName = "id")
    private Rider rider;

    public GoogleAccount() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String url) { this.profilePictureUrl = url; }

    public Rider getRider() { return rider; }
    public void setRider(Rider rider) { this.rider = rider; }
}