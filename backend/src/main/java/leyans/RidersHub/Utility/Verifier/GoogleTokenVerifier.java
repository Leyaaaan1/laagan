package leyans.RidersHub.Utility.Verifier;


import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifier.class);

    @Value("${GOOGLE_CLIENT_ID}")
    private String googleClientId;

    /**
     * Verifies the raw Google ID token against Google's public keys.
     * Returns the verified payload if valid.
     * Throws SecurityException if the token is null, invalid, or expired.
     */
    public GoogleIdToken.Payload verify(String rawIdToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(List.of(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(rawIdToken);

            if (idToken == null) {
                log.warn("Google token verification returned null — token invalid or expired");
                throw new SecurityException("Google ID token is invalid or expired");
            }

            log.debug("Google token verified for sub: {}", idToken.getPayload().getSubject());
            return idToken.getPayload();

        } catch (SecurityException e) {
            throw e; // re-throw — don't wrap
        } catch (Exception e) {
            log.error("❌ Google token verification failed", e);
            throw new SecurityException("Google token verification failed: " + e.getMessage());
        }
    }
}