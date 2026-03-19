package leyans.RidersHub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "rider_profile",
        indexes = {
                @Index(name = "idx_profile_username", columnList = "username")
        }
)
public class RiderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Integer profileId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "username", referencedColumnName = "username", nullable = false, unique = true)
    private Rider rider;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "bio", length = 500)
    private String bio;

    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;



    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * A rider may belong to multiple RiderTypes
     * (e.g. someone can be both a driver and a passenger).
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "rider_profile_types",
            joinColumns = @JoinColumn(name = "profile_id"),
            inverseJoinColumns = @JoinColumn(name = "rider_type_id")
    )
    private List<RiderType> riderTypes = new ArrayList<>();

    // ── Lifecycle ────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ── Constructors ─────────────────────────────────────────────────────

    public RiderProfile() {}

    // ── Getters / Setters ────────────────────────────────────────────────

    public Integer getProfileId() { return profileId; }
    public void setProfileId(Integer profileId) { this.profileId = profileId; }

    public Rider getRider() { return rider; }
    public void setRider(Rider rider) { this.rider = rider; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }


    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<RiderType> getRiderTypes() { return riderTypes; }
    public void setRiderTypes(List<RiderType> riderTypes) { this.riderTypes = riderTypes; }

    // ── Helpers ──────────────────────────────────────────────────────────

    public void addRiderType(RiderType riderType) {
        if (!this.riderTypes.contains(riderType)) {
            this.riderTypes.add(riderType);
        }
    }

    public void removeRiderType(RiderType riderType) {
        this.riderTypes.remove(riderType);
    }
}