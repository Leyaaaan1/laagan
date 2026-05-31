package leyans.RidersHub.Service.Auth;

import leyans.RidersHub.Config.JWT.JwtUtil;
import leyans.RidersHub.DTO.Request.LoginRequest;
import leyans.RidersHub.DTO.Request.RegisterRequest;
import leyans.RidersHub.DTO.Response.LoginResponse;
import leyans.RidersHub.DTO.Response.RegisterResponse;
import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.Service.RiderService;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.Rider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class LoginService {

    private static final Logger log = LoggerFactory.getLogger(LoginService.class);
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MINUTES = 15;

    @Value("${app.registration.max-users:50}")
    private int maxUsers;

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RiderService riderService;
    private final RefreshTokenService refreshTokenService;
    private final AccountLockoutService accountLockoutService;
    private final RiderUtil riderUtil;
    private final RiderRepository riderRepository;
    private final SupabaseAuthService supabaseAuthService;


    public LoginService(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            RiderService riderService,
            RefreshTokenService refreshTokenService,
            AccountLockoutService accountLockoutService, RiderUtil riderUtil, RiderRepository riderRepository, SupabaseAuthService supabaseAuthService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.riderService = riderService;
        this.refreshTokenService = refreshTokenService;
        this.accountLockoutService = accountLockoutService;
        this.riderUtil = riderUtil;
        this.riderRepository = riderRepository;
        this.supabaseAuthService = supabaseAuthService;
    }

    /**
     * Authenticate user and generate tokens
     */
    public LoginResponse login(LoginRequest loginRequest, String clientIp) {
        String email = loginRequest.getEmail();
        log.info("🔐 Login attempt from IP: {} for email: {}", clientIp, email);

        // 1. IP-level check first (broad gate) — throws RateLimitExceededException
        accountLockoutService.checkIpLoginRate(clientIp);

        // 2. Account-level lockout check (per-user gate)
        if (accountLockoutService.isAccountLocked(email)) {
            log.warn("🔒 Account locked for: {}", email);
            throw new IllegalStateException(
                    "Account temporarily locked. Try again in 15 minutes.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, loginRequest.getPassword()));

            Rider rider = riderUtil.findByAuthEmail(email)
                    .orElseThrow(() -> {
                        log.warn("⚠️ Login attempted for email with no Rider record: {}", email);
                        return new BadCredentialsException(
                                "Account not found. Please verify your email first.");
                    });

            String accessToken  = jwtUtil.generateToken(rider.getUsername());
            String refreshToken = refreshTokenService.createRefreshToken(rider.getUsername());

            // Reset both counters on success
            accountLockoutService.resetFailedAttempts(email);
            accountLockoutService.resetIpLoginAttempts(clientIp);

            log.info("✅ Login successful: {} ({})", rider.getUsername(), email);
            return new LoginResponse(accessToken, refreshToken, rider.getUsername());

        } catch (BadCredentialsException e) {
            accountLockoutService.recordFailedLoginAttempt(email);
            int remaining = accountLockoutService.getRemainingAttempts(email);
            log.warn("❌ Login failed for: {} | {} attempts remaining", email, remaining);
            throw new BadCredentialsException(
                    "Invalid email or password. " + remaining + " attempts remaining.");
        }
    }

    /**
     * Register new user and generate tokens
     */


    public RegisterResponse register(RegisterRequest registerRequest, String clientIp) {
        String email    = registerRequest.getEmail();
        String password = registerRequest.getPassword();

        log.info("📝 Register attempt from IP: {} for email: {}", clientIp, email);

        long totalUsers = riderRepository.count();
        if (totalUsers >= maxUsers) {
            throw new RuntimeException("Registration closed. Limit reached.");
        }

        try {
            int attempts = accountLockoutService.getRegisterAttempts(clientIp);

            // 3 is the original 999 is temporary for dev
            if (attempts >= 999) {
                throw new RuntimeException("Registration limit exceeded. Please try again later.");
            }

            // ── NEW: trigger Supabase email verification ──────────────
            supabaseAuthService.signUp(email, password);
            // ── Supabase sends the verify email. Stop here. ───────────
            // Don't create Rider yet — wait until email is confirmed.

            return new RegisterResponse(null, null, null);
            // Tell client to check their email

        } catch (RuntimeException e) {
            accountLockoutService.recordFailedRegisterAttempt(clientIp);
            log.warn("❌ Registration failed from IP: {} | {}", clientIp, e.getMessage());
            throw e;
        }
    }

    public LoginResponse verifyEmail(String accessToken, String tokenHash,
                                     String type, String clientIp) {
        String email;
        try {
            if (tokenHash != null && !tokenHash.isBlank()) {
                // PKCE flow — newer Supabase projects (no toggle)
                log.info("🔍 [verifyEmail] token_hash flow, type: {}", type);
                email = supabaseAuthService.getEmailFromTokenHash(tokenHash, type);
            } else if (accessToken != null && !accessToken.isBlank()) {
                // Implicit flow — older Supabase or PKCE disabled
                log.info("🔍 [verifyEmail] access_token flow");
                email = supabaseAuthService.getEmailFromToken(accessToken);
            } else {
                throw new RuntimeException("No verification token provided.");
            }
        } catch (Exception e) {
            log.error("❌ [verifyEmail] Token decode failed: {}", e.getMessage());
            throw new RuntimeException("Invalid or expired verification token. Please register again.");
        }

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Verification token contained no email address.");
        }

        log.info("🔍 [verifyEmail] Verified email: {}", email);

        // ── Idempotent: Rider already exists (link tapped twice) ──
        Optional<Rider> existingRider = riderUtil.findByAuthEmail(email);
        if (existingRider.isPresent()) {
            Rider rider = existingRider.get();
            log.info("✅ [verifyEmail] Rider already exists — issuing tokens for: {}", email);
            String existingAccess  = jwtUtil.generateToken(rider.getUsername());
            String existingRefresh = refreshTokenService.createRefreshToken(rider.getUsername());
            return new LoginResponse(existingAccess, existingRefresh, rider.getUsername());
        }

        // ── First-time: create the Rider ──
        String localPart = email.contains("@")
                ? email.substring(0, email.indexOf('@'))
                  .toLowerCase()
                  .replaceAll("[^a-z0-9_]", "_")
                : email.toLowerCase();

        String displayUsername = ensureUniqueUsername(localPart);
        log.info("🆕 [verifyEmail] Creating Rider — username: {}, email: {}", displayUsername, email);

        String registeredUsername;
        try {
            registeredUsername = riderService.registerRiderWithValidation(
                    displayUsername, email, null, clientIp, accountLockoutService);
        } catch (Exception e) {
            log.error("❌ [verifyEmail] registerRiderWithValidation failed: {}", e.getMessage(), e);
            throw new RuntimeException("Account creation failed: " + e.getMessage());
        }

        String myAccessToken  = jwtUtil.generateToken(registeredUsername);
        String myRefreshToken = refreshTokenService.createRefreshToken(registeredUsername);

        log.info("✅ [verifyEmail] Rider created — username: {}", registeredUsername);
        return new LoginResponse(myAccessToken, myRefreshToken, registeredUsername);
    }







    // ADD this private helper at the bottom of the class (same logic as FacebookTokenVerifier)
// Later: extract both copies into a shared UsernameGenerator utility
    private String ensureUniqueUsername(String base) {
        String candidate = base;
        int suffix = 2;
        while (riderService.usernameExists(candidate)) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }

    /**
     * Logout user by blacklisting token
     */
    public void logout(String token, TokenBlacklistService tokenBlacklistService) {
        try {
            String username = jwtUtil.getUsernameFromToken(token);
            String jti = jwtUtil.getJtiFromToken(token);

            if (jti != null) {
                long remainingMs = jwtUtil.getTokenExpirationMs(token);
                tokenBlacklistService.blacklistToken(jti, Math.max(remainingMs, 1000));
            }

            // Revoke all refresh tokens
            if (username != null) {
                refreshTokenService.revokeAll(username);
            }

            log.info("✅ User logged out: {}", username);
        } catch (Exception e) {
            log.error("❌ Error during logout", e);
            throw new RuntimeException("Logout failed: " + e.getMessage());
        }
    }
}