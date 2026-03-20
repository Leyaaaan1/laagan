package leyans.RidersHub.DTO.Request;

import java.util.List;


public class RiderProfileRequestDTO {

    private String displayName;
    private String bio;
    private String profilePictureUrl;
    private String phoneNumber;

    /** Names of RiderTypes to assign to this profile. */
    private List<String> riderTypeNames;

    public RiderProfileRequestDTO() {}

    // ── Getters / Setters ────────────────────────────────────────────────

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public List<String> getRiderTypeNames() { return riderTypeNames; }
    public void setRiderTypeNames(List<String> riderTypeNames) { this.riderTypeNames = riderTypeNames; }
}
