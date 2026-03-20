package leyans.RidersHub.Utility;

import leyans.RidersHub.DTO.Response.RiderProfileResponseDTO;
import leyans.RidersHub.model.RiderProfile;
import org.springframework.stereotype.Component;

@Component
public class RiderProfileUtil {

    /**
     * Build a response DTO from a profile entity.
     * Central mapping point — update here if the DTO structure changes.
     */
    public RiderProfileResponseDTO toResponseDTO(RiderProfile profile) {
        return new RiderProfileResponseDTO(profile);
    }

    /**
     * Returns a best-effort display name: prefers the stored displayName,
     * falls back to the rider's username.
     */
    public String resolveDisplayName(RiderProfile profile) {
        String displayName = profile.getDisplayName();
        if (displayName != null && !displayName.isBlank()) {
            return displayName;
        }
        return profile.getRider().getUsername();
    }

    /**
     * Validates a phone number string with a simple digit/length check.
     * Extend with libphonenumber for production use.
     */
    public boolean isValidPhoneNumber(String phone) {
        if (phone == null || phone.isBlank()) return false;
        String digits = phone.replaceAll("[\\s\\-+()]", "");
        return digits.matches("\\d{7,15}");
    }

    /**
     * Sanitises a bio: trims whitespace and enforces max length.
     */
    public String sanitiseBio(String bio, int maxLength) {
        if (bio == null) return null;
        String trimmed = bio.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }
}
