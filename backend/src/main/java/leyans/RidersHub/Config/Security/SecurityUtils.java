package leyans.RidersHub.Config.Security;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {


    /**
     * Gets the current authenticated username.
     * @return the username of the authenticated user or null if not authenticated
     */
    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return authentication.getName();
    }

    /**
     * Checks if the current user is authenticated (not anonymous).
     * @return true if authenticated, false otherwise
     */
    public static boolean isAuthenticated() {
        String username = getCurrentUsername();
        return username != null;
    }

    /**
     * Creates an unauthorized response when authentication is required.
     * @return ResponseEntity with UNAUTHORIZED status
     */
    public static ResponseEntity<?> createUnauthorizedResponse() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Authentication required");
    }

    /**
     * Validates if a user is authenticated and returns appropriate response if not.
     * @return null if authenticated, or unauthorized response if not
     */
    public static ResponseEntity<?> validateAuthentication() {
        if (!isAuthenticated()) {
            return createUnauthorizedResponse();
        }
        return null;
    }
}