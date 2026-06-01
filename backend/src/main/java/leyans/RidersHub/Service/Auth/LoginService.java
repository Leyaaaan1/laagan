
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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

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
    private final EmailVerificationService emailVerificationService;

    public LoginService(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            RiderService riderService,
            RefreshTokenService refreshTokenService,
            AccountLockoutService accountLockoutService,
            RiderUtil riderUtil,
            RiderRepository riderRepository,
            EmailVerificationService emailVerificationService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.riderService = riderService;
        this.refreshTokenService = refreshTokenService;
        this.accountLockoutService = accountLockoutService;
        this.riderUtil = riderUtil;
        this.riderRepository = riderRepository;
        this.emailVerificationService = emailVerificationService;
    }

    /**     * Authenticate user and generate tokens     */
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
                    .orElseThrow(() -> new RuntimeException("Rider not found for: " + email));

            // ✅ CHECK IF EMAIL IS VERIFIED
            if (!rider.getEmailVerified()) {
                log.warn("📧 Email not verified for: {}", email);
                throw new IllegalStateException(
                        "Email not verified. Check your inbox for verification link.");
            }

            String accessToken = jwtUtil.generateToken(rider.getUsername());
            String refreshToken = refreshTokenService.createRefreshToken(rider.getUsername());

            // Reset both counters on success
            accountLockoutService.resetFailedAttempts(email);
            accountLockoutService.resetIpLoginAttempts(clientIp);

            log.info(" Login successful: {} ({})", rider.getUsername(), email);
            return new LoginResponse(accessToken, refreshToken, rider.getUsername());

        } catch (BadCredentialsException e) {
            accountLockoutService.recordFailedLoginAttempt(email);
            int remaining = accountLockoutService.getRemainingAttempts(email);
            log.warn(" Login failed for: {} | {} attempts remaining", email, remaining);
            throw new BadCredentialsException(
                    "Invalid email or password. " + remaining + " attempts remaining.");
        }
    }


    /** * Register new user and generate tokens */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RegisterResponse register(RegisterRequest registerRequest, String clientIp) {
        String email = registerRequest.getEmail();
        String password = registerRequest.getPassword();

        log.info(" Register attempt from IP: {} for email: {}", clientIp, email);

        long totalUsers = riderRepository.count();
        if (totalUsers >= maxUsers) {
            throw new RuntimeException("Registration closed. Limit reached.");
        }

        try {
            int attempts = accountLockoutService.getRegisterAttempts(clientIp);
            if (attempts >= 3) {
                log.warn("⚠ Registration limit exceeded for IP: {}", clientIp);
                throw new RuntimeException("Registration limit exceeded. Please try again later.");
            }

            // Derive display username from email local-part
            // "juandelacruz@gmail.com" → "juandelacruz"
            String localPart = email.contains("@")
                    ? email.substring(0, email.indexOf('@'))
                      .toLowerCase()
                      .replaceAll("[^a-z0-9_]", "_")
                    : email.toLowerCase();
            String displayUsername = ensureUniqueUsername(localPart);

            String registeredUsername = riderService.registerRiderWithValidation(
                    displayUsername,
                    email,
                    password,
                    clientIp,
                    accountLockoutService
            );

            // ✅ Send verification email
            emailVerificationService.sendVerificationToken(email);
            log.info(" Verification email sent to: {}", email);

            log.info(" Registered (awaiting email verification): {} (email: {})", registeredUsername, email);
            return new RegisterResponse(null, null, registeredUsername);

        } catch (RuntimeException e) {
            accountLockoutService.recordFailedRegisterAttempt(clientIp);
            log.warn(" Registration failed from IP: {} | {}", clientIp, e.getMessage());
            throw e;
        }
    }
    /**     * Ensure username is unique by appending suffix if needed     */
    private String ensureUniqueUsername(String base) {
        String candidate = base;
        int suffix = 2;
        while (riderService.usernameExists(candidate)) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }

    /**     * Logout user by blacklisting token     */
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

            log.info(" User logged out: {}", username);
        } catch (Exception e) {
            log.error(" Error during logout", e);
            throw new RuntimeException("Logout failed: " + e.getMessage());
        }
    }
}