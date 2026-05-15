package leyans.RidersHub.Utility;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import leyans.RidersHub.Repository.Auth.FacebookAccountRepository;
import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.auth.FacebookAccount;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;

@Service
public class FacebookTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(FacebookTokenVerifier.class);

    @Value("${FACEBOOK_CLIENT_ID}")
    private String appId;

    @Value("${FACEBOOK_APP_SECRET}")
    private String appSecret;

    private final RiderRepository riderRepository;
    private final FacebookAccountRepository facebookAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public FacebookTokenVerifier(RiderRepository riderRepository,
                                 FacebookAccountRepository facebookAccountRepository,
                                 PasswordEncoder passwordEncoder) {
        this.riderRepository = riderRepository;
        this.facebookAccountRepository = facebookAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // verify
    //
    // Full flow:
    //   1. Validate the FB access token via the Graph debug_token endpoint.
    //   2. Fetch the user's id, name, email, and picture from Graph API.
    //   3. Derive two separate identifiers:
    //        authIdentifier  → used for Spring Security login (Rider.authEmail)
    //                          Prefer email; fall back to facebookId if no email
    //                          permission was granted.
    //        displayUsername → used as the in-app display name (Rider.username)
    //                          Derived from the FB display name; guaranteed unique
    //                          via ensureUniqueUsername().
    //   4. Find-or-create:
    //        Lookup key = FacebookAccount.facebookId (stable, never changes).
    //        Do NOT look up by email — the user may have changed it on Facebook.
    //   5. Return Map.of("username", rider.getUsername()) so the caller
    //      (FacebookLoginController) always gets the display name, never the email.
    //
    // What changed from the old version:
    //   OLD: username = email (or name as fallback) — one field doing two jobs
    //   NEW: authIdentifier (→ Rider.authEmail) and displayUsername (→ Rider.username)
    //        are derived and stored separately from the start.
    //   OLD: facebookAccountRepository.findByUsername(email)
    //   NEW: facebookAccountRepository.findByFacebookId(facebookId) — stable key
    //   OLD: FacebookAccount stored username + random-UUID password (dead weight)
    //   NEW: FacebookAccount stores facebookId + email only
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public Map<String, String> verify(String fbAccessToken) {
        try {
            // ── Step 1: Validate token with Facebook ──────────────────────────
            String appToken = appId + "|" + appSecret;
            String verifyUrl = "https://graph.facebook.com/debug_token"
                    + "?input_token=" + java.net.URLEncoder.encode(fbAccessToken, "UTF-8")
                    + "&access_token=" + java.net.URLEncoder.encode(appToken, "UTF-8");

            HttpResponse<String> verifyResponse = httpClient.send(
                    HttpRequest.newBuilder().uri(URI.create(verifyUrl)).GET().build(),
                    HttpResponse.BodyHandlers.ofString());

            JsonNode verifyNode = objectMapper.readTree(verifyResponse.body());
            boolean isValid = verifyNode.path("data").path("is_valid").asBoolean(false);

            if (!isValid) {
                log.warn("❌ Facebook token is invalid");
                return null;
            }

            // ── Step 2: Fetch user profile ────────────────────────────────────
            String userUrl = "https://graph.facebook.com/me"
                    + "?fields=id,name,email,picture"
                    + "&access_token=" + fbAccessToken;

            HttpResponse<String> userResponse = httpClient.send(
                    HttpRequest.newBuilder().uri(URI.create(userUrl)).GET().build(),
                    HttpResponse.BodyHandlers.ofString());

            JsonNode userNode = objectMapper.readTree(userResponse.body());

            String facebookId = userNode.path("id").asText(null);
            String email      = userNode.path("email").asText(null);
            String name       = userNode.path("name").asText(null);
            String picture    = userNode.path("picture").path("data").path("url").asText(null);

            if (facebookId == null || facebookId.isBlank()) {
                log.warn("❌ Could not get facebookId from Facebook response");
                return null;
            }

            // ── Step 3a: Derive the auth identifier (→ Rider.authEmail) ───────
            // Prefer email because it's human-readable and usable for future
            // password-reset flows. Fall back to the facebookId if the user
            // denied the email permission — it's still a stable, unique key.
            String authIdentifier = (email != null && !email.isBlank()) ? email : facebookId;

            // ── Step 3b: Derive the display username (→ Rider.username) ───────
            // Normalise the FB display name to a safe handle:
            //   "Juan dela Cruz" → "juan_dela_cruz"
            // If no name is available (unlikely), fall back to "rider_<facebookId>".
            // ensureUniqueUsername() appends a numeric suffix if the handle is taken.
            String rawDisplayName = (name != null && !name.isBlank())
                    ? name.trim().replaceAll("\\s+", "_").toLowerCase()
                    : "rider_" + facebookId;
            String displayUsername = ensureUniqueUsername(rawDisplayName);

            // ── Step 4: Find or create the Rider + FacebookAccount ────────────
            // Always look up by facebookId — it never changes even if the user
            // updates their email on Facebook.
            FacebookAccount fbAccount = facebookAccountRepository.findByFacebookId(facebookId);

            if (fbAccount == null) {
                // New Facebook user — create the Rider first, then the account link
                Rider rider = new Rider();
                rider.setUsername(displayUsername);          // in-app display name
                rider.setAuthEmail(authIdentifier);          // login credential
                rider.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                rider.setEnabled(true);
                try { rider.setRiderTypes(new ArrayList<>()); } catch (Exception ignored) {}
                riderRepository.saveAndFlush(rider);

                fbAccount = new FacebookAccount();
                fbAccount.setFacebookId(facebookId);         // stable FB lookup key
                fbAccount.setEmail(email);                   // informational only
                fbAccount.setProfilePictureUrl(picture);
                fbAccount.setRider(rider);
                facebookAccountRepository.save(fbAccount);

                log.info("✅ New Facebook rider created: username={}, authEmail={}", displayUsername, authIdentifier);
            } else {
                // Returning user — optionally refresh their picture
                if (picture != null && !picture.equals(fbAccount.getProfilePictureUrl())) {
                    fbAccount.setProfilePictureUrl(picture);
                    facebookAccountRepository.save(fbAccount);
                }
                log.info("✅ Existing Facebook rider found: username={}", fbAccount.getRider().getUsername());
            }

            // ── Step 5: Return the display username to the controller ─────────
            // The controller uses this to issue the JWT and to include the
            // username in the login response sent back to the mobile app.
            // We never return the email or facebookId to the client from here.
            return Map.of("username", fbAccount.getRider().getUsername());

        } catch (Exception e) {
            log.error("❌ Facebook token verification error", e);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ensureUniqueUsername
    //
    // Appends an incrementing numeric suffix until the username is not taken.
    // Examples:
    //   "juan_dela_cruz"   → already free → returns "juan_dela_cruz"
    //   "juan_dela_cruz"   → taken        → tries "juan_dela_cruz_2", etc.
    //
    // This is intentionally simple. If you later add a username-change feature
    // you can let users pick their own handle after first login and retire this.
    // ─────────────────────────────────────────────────────────────────────────
    private String ensureUniqueUsername(String base) {
        String candidate = base;
        int suffix = 2;
        while (riderRepository.findByUsername(candidate).isPresent()) {
            candidate = base + "_" + suffix;
            suffix++;
        }
        return candidate;
    }
}