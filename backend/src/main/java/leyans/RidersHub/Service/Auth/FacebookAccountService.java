package leyans.RidersHub.Service.Auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import leyans.RidersHub.Repository.Auth.FacebookAccountRepository;
import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.auth.FacebookAccount;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class FacebookAccountService {

    private final FacebookAccountRepository facebookAccountRepository;
    private final RiderRepository riderRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${fb_app_id}")
    private String facebookAppId;

    @Value("${fb_app_secret}")
    private String facebookAppSecret;

    @Autowired
    public FacebookAccountService(FacebookAccountRepository facebookAccountRepository,
                                  RiderRepository riderRepository) {
        this.facebookAccountRepository = facebookAccountRepository;
        this.riderRepository = riderRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Validates Facebook access token and gets user info
     */
    public FacebookAccount loginOrCreateFacebookAccount(String accessToken) {
        try {
            // Step 1: Verify the access token with Facebook
            String appAccessToken = facebookAppId + "|" + facebookAppSecret;
            String debugUrl = String.format(
                    "https://graph.facebook.com/debug_token?input_token=%s&access_token=%s",
                    accessToken, appAccessToken
            );

            String debugResponse = restTemplate.getForObject(debugUrl, String.class);
            JsonNode debugData = objectMapper.readTree(debugResponse);

            // Check if token is valid
            if (!debugData.path("data").path("is_valid").asBoolean()) {
                throw new RuntimeException("Invalid Facebook access token");
            }

            // Step 2: Get user profile information
            String userInfoUrl = String.format(
                    "https://graph.facebook.com/me?fields=id,name,picture.type(large)&access_token=%s",
                    accessToken
            );

            String userInfoResponse = restTemplate.getForObject(userInfoUrl, String.class);
            JsonNode userInfo = objectMapper.readTree(userInfoResponse);

            String facebookId = userInfo.path("id").asText();
            String name = userInfo.path("name").asText();
            String profilePictureUrl = userInfo.path("picture").path("data").path("url").asText();

            // Step 3: Check if Facebook account exists
            FacebookAccount existingAccount = facebookAccountRepository.findByUsername(facebookId);

            if (existingAccount != null) {
                // Update profile picture if changed
                existingAccount.setProfilePictureUrl(profilePictureUrl);
                return facebookAccountRepository.save(existingAccount);
            }

            // Step 4: Create new Rider and FacebookAccount
            Rider newRider = new Rider();
            newRider.setUsername(name); // Use Facebook name or ID
            newRider.setPassword("FACEBOOK_AUTH");
            newRider.setEnabled(true);
            newRider.setRiderType(null);

            Rider savedRider = riderRepository.save(newRider);

            FacebookAccount newAccount = new FacebookAccount();
            newAccount.setUsername(facebookId); // Store Facebook ID as username
            newAccount.setPassword("FACEBOOK_AUTH");
            newAccount.setProfilePictureUrl(profilePictureUrl);
            newAccount.setRider(savedRider);

            return facebookAccountRepository.save(newAccount);

        } catch (Exception e) {
            throw new RuntimeException("Facebook authentication failed: " + e.getMessage());
        }
    }
}