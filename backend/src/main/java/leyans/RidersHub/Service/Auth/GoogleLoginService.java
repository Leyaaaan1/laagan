package leyans.RidersHub.Service.Auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import leyans.RidersHub.Config.JWT.JwtUtil;
import leyans.RidersHub.DTO.Response.LoginResponse;
import leyans.RidersHub.Repository.Auth.GoogleAccountRepository;
import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.Service.RiderService;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.Utility.Verifier.GoogleTokenVerifier;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.auth.GoogleAccount;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class GoogleLoginService {

    private static final Logger log = LoggerFactory.getLogger(GoogleLoginService.class);

    private final GoogleTokenVerifier googleTokenVerifier;
    private final RiderService riderService;
    private final RiderUtil riderUtil;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final AccountLockoutService accountLockoutService;
    private final GoogleAccountRepository googleAccountRepository;

    private final RiderRepository riderRepository;
    @Value("${app.registration.max-users:50}")
    private int maxUsers;

    public GoogleLoginService(GoogleTokenVerifier googleTokenVerifier,
                              RiderService riderService,
                              RiderUtil riderUtil,
                              JwtUtil jwtUtil,
                              RefreshTokenService refreshTokenService,
                              AccountLockoutService accountLockoutService, GoogleAccountRepository googleAccountRepository, RiderRepository riderRepository) {
        this.googleTokenVerifier = googleTokenVerifier;
        this.riderService = riderService;
        this.riderUtil = riderUtil;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
        this.accountLockoutService = accountLockoutService;
        this.googleAccountRepository = googleAccountRepository;
        this.riderRepository = riderRepository;
    }

    @Transactional
    public LoginResponse loginWithGoogle(String rawIdToken, String clientIp) {

        // 1. Validate input
        if (rawIdToken == null || rawIdToken.isBlank()) {
            throw new IllegalArgumentException("idToken must not be blank");
        }

        // 2. IP-level rate check
        accountLockoutService.checkIpLoginRate(clientIp);

        // 3. Global user cap
        long totalUsers = riderRepository.count();
        if (totalUsers >= maxUsers) {
            throw new RuntimeException("Registration closed. Limit reached.");
        }

        // 4. Verify token with Google
        GoogleIdToken.Payload payload = googleTokenVerifier.verify(rawIdToken);

        String googleId = payload.getSubject();
        String email    = payload.getEmail();
        String name     = (String) payload.get("name");
        Boolean emailVerified = (Boolean) payload.get("email_verified"); // ← ADD

        // 5. Find or create Rider + GoogleAccount
        String resolvedUsername = findOrCreateRider(googleId, email, name, Boolean.TRUE.equals(emailVerified)); // ← ADD param

        Rider rider = riderUtil.findRiderByUsername(resolvedUsername);

        // 6. Issue tokens
        String accessToken  = jwtUtil.generateToken(resolvedUsername);
        String refreshToken = refreshTokenService.createRefreshToken(resolvedUsername);

        return new LoginResponse(accessToken, refreshToken, resolvedUsername);
    }
    /**
     * Returns the username of the existing rider if found by email,
     * or creates a new rider (Google-only, no password) and returns their username.
     */
    @Transactional
    protected String findOrCreateRider(String googleId, String email, String googleDisplayName, boolean emailVerified) { // ← ADD param

        // 1. Check if this Google account already exists
        Optional<GoogleAccount> existingAccount = googleAccountRepository.findByGoogleId(googleId);
        if (existingAccount.isPresent()) {
            log.info("♻️ Existing Google account found for googleId: {}", googleId);
            return existingAccount.get().getRider().getUsername();
        }

        // 2. Check if a rider exists with this email
        Optional<Rider> existingRider = riderUtil.findByAuthEmail(email);
        Rider rider;

        if (existingRider.isPresent()) {
            // Link Google account to existing rider
            rider = existingRider.get();
            log.info("🔗 Linking Google account to existing rider: {}", rider.getUsername());
        } else {
            // 3. Brand new rider — create one
            String localPart = email.contains("@")
                    ? email.substring(0, email.indexOf('@'))
                      .toLowerCase().replaceAll("[^a-z0-9_]", "_")
                    : email.toLowerCase();
            String username = ensureUniqueUsername(localPart);

            rider = new Rider();
            rider.setUsername(username);
            rider.setAuthEmail(email);
            rider.setPassword(null);
            rider.setEnabled(true);
            rider.setEmailVerified(emailVerified); // ← replaces hardcoded true
            riderRepository.save(rider);

            log.info("🆕 New rider created via Google: {} ({})", username, email);
        }

        // 4. Create GoogleAccount record linked to this rider
        GoogleAccount googleAccount = new GoogleAccount();
        googleAccount.setGoogleId(googleId);
        googleAccount.setEmail(email);
        googleAccount.setRider(rider);
        googleAccountRepository.save(googleAccount);

        return rider.getUsername();
    }
    // Same helper as LoginService — later extract both into a shared UsernameGenerator utility
    private String ensureUniqueUsername(String base) {
        String candidate = base;
        int suffix = 2;
        while (riderService.usernameExists(candidate)) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }
}