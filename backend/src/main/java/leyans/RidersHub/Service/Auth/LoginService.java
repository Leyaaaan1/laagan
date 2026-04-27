package leyans.RidersHub.Service.Auth;

import leyans.RidersHub.Config.JWT.JwtUtil;
import leyans.RidersHub.DTO.Request.LoginRequest;
import leyans.RidersHub.DTO.Request.RegisterRequest;
import leyans.RidersHub.DTO.Response.LoginResponse;
import leyans.RidersHub.DTO.Response.RegisterResponse;
import leyans.RidersHub.Service.RiderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LoginService {

    private static final Logger log = LoggerFactory.getLogger(LoginService.class);
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MINUTES = 15;

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RiderService riderService;
    private final RefreshTokenService refreshTokenService;
    private final AccountLockoutService accountLockoutService;

    public LoginService(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            RiderService riderService,
            RefreshTokenService refreshTokenService,
            AccountLockoutService accountLockoutService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.riderService = riderService;
        this.refreshTokenService = refreshTokenService;
        this.accountLockoutService = accountLockoutService;
    }

    /**
     * Authenticate user and generate tokens
     */
    public LoginResponse login(LoginRequest loginRequest) throws BadCredentialsException {
        String username = loginRequest.getUsername();
        log.info("🔐 Login attempt for user: {}", username);

        // Check if account is locked
        if (accountLockoutService.isAccountLocked(username)) {
            log.warn("🔒 Account locked for user: {}", username);
            throw new IllegalStateException("Account temporarily locked. Please try again in 15 minutes.");
        }

        try {
            // Authenticate using AuthenticationManager
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, loginRequest.getPassword())
            );

            // Generate tokens
            String accessToken = jwtUtil.generateToken(username);
            String refreshToken = refreshTokenService.createRefreshToken(username);

            // Reset failed attempts on successful login
            accountLockoutService.resetFailedAttempts(username);

            log.info("✅ Login successful for user: {}", username);
            return new LoginResponse(accessToken, refreshToken);

        } catch (BadCredentialsException e) {
            // Record failed attempt
            accountLockoutService.recordFailedLoginAttempt(username);
            int remaining = accountLockoutService.getRemainingAttempts(username);

            log.warn("❌ Login failed for user: {} | {} attempts remaining", username, remaining);
            throw new BadCredentialsException("Invalid username or password. " + remaining + " attempts remaining.");
        }
    }

    /**
     * Register new user and generate tokens
     */
    public RegisterResponse register(RegisterRequest registerRequest, String clientIp) {
        String username = registerRequest.getUsername();
        String password = registerRequest.getPassword();
        String riderType = registerRequest.getRiderType();

        log.info("📝 Register attempt from IP: {} for user: {}", clientIp, username);

        try {
            // Validate registration rate limit
            int attempts = accountLockoutService.getRegisterAttempts(clientIp);
            if (attempts >= 3) {
                log.warn("⚠️  Registration limit exceeded for IP: {}", clientIp);
                throw new RuntimeException("Registration limit exceeded. Please try again later.");
            }

            // Register rider
            String registeredUsername = riderService.registerRiderWithValidation(
                    username,
                    password,
                    riderType,
                    clientIp,
                    accountLockoutService
            );

            // Generate tokens
            String accessToken = jwtUtil.generateToken(registeredUsername);
            String refreshToken = refreshTokenService.createRefreshToken(registeredUsername);

            log.info("✅ New user registered: {} from IP: {}", registeredUsername, clientIp);
            return new RegisterResponse(accessToken, refreshToken);

        } catch (RuntimeException e) {
            accountLockoutService.recordFailedRegisterAttempt(clientIp);
            log.warn("❌ Registration failed from IP: {} | Error: {}", clientIp, e.getMessage());
            throw e;
        }
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