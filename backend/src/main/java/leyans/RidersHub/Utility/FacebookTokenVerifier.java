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

    @Value("${FACEBOOK_CLIENT_SECRET}")
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

    @Transactional
    public Map<String, String> verify(String fbAccessToken) {
        try {
            // 1. Verify token is valid with Facebook debug_token endpoint
            String appToken  = appId + "|" + appSecret;
            String verifyUrl = "https://graph.facebook.com/debug_token"
                    + "?input_token=" + fbAccessToken
                    + "&access_token=" + appToken;

            HttpResponse<String> verifyResponse = httpClient.send(
                    HttpRequest.newBuilder().uri(URI.create(verifyUrl)).GET().build(),
                    HttpResponse.BodyHandlers.ofString());

            JsonNode verifyNode = objectMapper.readTree(verifyResponse.body());
            boolean isValid = verifyNode.path("data").path("is_valid").asBoolean(false);

            if (!isValid) {
                log.warn("❌ Facebook token is invalid");
                return null;
            }

            // 2. Get user profile from Facebook Graph API
            String userUrl = "https://graph.facebook.com/me"
                    + "?fields=id,name,email,picture"
                    + "&access_token=" + fbAccessToken;

            HttpResponse<String> userResponse = httpClient.send(
                    HttpRequest.newBuilder().uri(URI.create(userUrl)).GET().build(),
                    HttpResponse.BodyHandlers.ofString());

            JsonNode userNode = objectMapper.readTree(userResponse.body());
            String email    = userNode.path("email").asText(null);
            String name     = userNode.path("name").asText(null);
            String picture  = userNode.path("picture").path("data").path("url").asText(null);
            String username = (email != null && !email.isBlank()) ? email : name;

            if (username == null) {
                log.warn("❌ Could not get username from Facebook");
                return null;
            }

            // 3. Find or create rider — same logic as your FacebookOAuth2UserService
            FacebookAccount fbAccount = facebookAccountRepository.findByUsername(username);

            if (fbAccount == null) {
                Rider rider = new Rider();
                rider.setUsername(username);
                rider.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                rider.setEnabled(true);
                try { rider.setRiderTypes(new ArrayList<>()); } catch (Exception ignored) {}
                riderRepository.saveAndFlush(rider);

                fbAccount = new FacebookAccount();
                fbAccount.setUsername(username);
                fbAccount.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                fbAccount.setProfilePictureUrl(picture);
                fbAccount.setRider(rider);
                facebookAccountRepository.save(fbAccount);

                log.info("✅ New Facebook rider created: {}", username);
            } else {
                log.info("✅ Existing Facebook rider found: {}", username);
            }

            return Map.of("username", username);

        } catch (Exception e) {
            log.error("❌ Facebook token verification error", e);
            return null;
        }
    }
}