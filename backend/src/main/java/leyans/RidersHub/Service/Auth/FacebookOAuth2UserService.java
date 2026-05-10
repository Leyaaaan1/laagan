package leyans.RidersHub.Service.Auth;

import leyans.RidersHub.Repository.Auth.FacebookAccountRepository;
import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.auth.FacebookAccount;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

@Service
public class FacebookOAuth2UserService extends DefaultOAuth2UserService {

    private final FacebookAccountRepository facebookAccountRepository;
    private final RiderRepository riderRepository;
    private final PasswordEncoder passwordEncoder;

    public FacebookOAuth2UserService(FacebookAccountRepository facebookAccountRepository,
                                     RiderRepository riderRepository,
                                     PasswordEncoder passwordEncoder) {
        this.facebookAccountRepository = facebookAccountRepository;
        this.riderRepository = riderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        // 1. Fetch user info from Facebook
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email   = oAuth2User.getAttribute("email");
        String name    = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        // 2. Use email as username, fallback to name
        String username = (email != null) ? email : name;

        if (username == null) {
            throw new RuntimeException("Could not retrieve username from Facebook");
        }

        // 3. Find or create FacebookAccount
        FacebookAccount fbAccount = facebookAccountRepository.findByUsername(username);

        if (fbAccount == null) {
            // 4. Create linked Rider first
            Rider rider = new Rider();
            rider.setUsername(username);
            rider.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            rider.setEnabled(true);

            // Only set if your Rider entity has this field
            try {
                rider.setRiderTypes(new ArrayList<>());
            } catch (Exception ignored) {}

            riderRepository.saveAndFlush(rider);

            // 5. Create FacebookAccount linked to Rider
            fbAccount = new FacebookAccount();
            fbAccount.setUsername(username);
            fbAccount.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            fbAccount.setProfilePictureUrl(picture);
            fbAccount.setRider(rider);
            facebookAccountRepository.save(fbAccount);
        }

        return oAuth2User;
    }
}