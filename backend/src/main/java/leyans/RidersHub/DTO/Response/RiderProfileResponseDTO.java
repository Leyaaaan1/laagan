package leyans.RidersHub.DTO.Response;

import leyans.RidersHub.model.RiderProfile;
import leyans.RidersHub.model.RiderType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class RiderProfileResponseDTO {

    private String username;
    private String displayName;
    private String bio;
    private String profilePictureUrl;
    private List<String> riderTypes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public RiderProfileResponseDTO(RiderProfile profile) {
        this.username          = profile.getRider().getUsername();
        this.displayName       = profile.getDisplayName();
        this.bio               = profile.getBio();
        this.profilePictureUrl = profile.getProfilePictureUrl();
        this.createdAt         = profile.getCreatedAt();
        this.updatedAt         = profile.getUpdatedAt();

        // ── riderTypes: prefer profile list, fall back to Rider.riderType ──
        // Profiles created before the seeding fix have an empty list.
        // The fallback ensures the frontend always gets a value.
        List<RiderType> profileTypes = profile.getRiderTypes();
        if (profileTypes != null && !profileTypes.isEmpty()) {
            this.riderTypes = profileTypes.stream()
                    .map(RiderType::getRiderType)
                    .collect(Collectors.toList());
        } else {
            // fallback: use the type stored on the Rider entity itself
            RiderType fallback = profile.getRider().getRiderType();
            this.riderTypes = new ArrayList<>();
            if (fallback != null) {
                this.riderTypes.add(fallback.getRiderType());
            }
        }
    }

    public RiderProfileResponseDTO() {}

    // ── Getters / Setters ────────────────────────────────────────────────

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public List<String> getRiderTypes() { return riderTypes; }
    public void setRiderTypes(List<String> riderTypes) { this.riderTypes = riderTypes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}