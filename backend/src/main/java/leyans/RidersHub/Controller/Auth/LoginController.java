package leyans.RidersHub.Controller.Auth;

import leyans.RidersHub.Config.JWT.JwtUtil;
import leyans.RidersHub.Config.Security.SecurityUtils;
import leyans.RidersHub.Config.Security.ClientIpResolver;
import leyans.RidersHub.DTO.Request.LoginRequest;
import leyans.RidersHub.DTO.Request.RegisterRequest;
import leyans.RidersHub.DTO.Response.LoginResponse;
import leyans.RidersHub.DTO.Response.RegisterResponse;
import leyans.RidersHub.Service.Auth.AccountLockoutService;
import leyans.RidersHub.Service.Auth.RefreshTokenService;
import leyans.RidersHub.Service.RiderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/riders")
public class LoginController {

    private static final Logger log = LoggerFactory.getLogger(LoginController.class);

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RiderService riderService;
    private final RefreshTokenService refreshTokenService;
    private final AccountLockoutService accountLockoutService;
    private final ClientIpResolver clientIpResolver;
    private final HttpServletRequest request;

    public LoginController(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            RiderService riderService,
            RefreshTokenService refreshTokenService,
            AccountLockoutService accountLockoutService,
            ClientIpResolver clientIpResolver,
            HttpServletRequest request) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.riderService = riderService;
        this.refreshTokenService = refreshTokenService;
        this.accountLockoutService = accountLockoutService;
        this.clientIpResolver = clientIpResolver;
        this.request = request;
    }

    /**
     * POST /riders/login
     * Rate limited to 5 attempts per minute per username.
     * Account locks after 5 failed attempts for 15 minutes.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        String username = loginRequest.getUsername();

        log.info(" Login attempt for user: {}", username);

        // Check if account is locked
        if (accountLockoutService.isAccountLocked(username)) {
            log.warn(" Login attempt on LOCKED account: {}", username);
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.FORBIDDEN.value());
            response.put("error", "Account temporarily locked");
            response.put("message", "Account is locked due to too many failed login attempts. Please try again in 15 minutes.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            username, loginRequest.getPassword()));

            String accessToken = jwtUtil.generateToken(username);
            String refreshToken = refreshTokenService.createRefreshToken(username);

            //  Reset failed attempts on successful login
            accountLockoutService.resetFailedAttempts(username);
            log.info(" Login successful for user: {}", username);

            return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken));

        } catch (BadCredentialsException e) {
            // Record failed attempt
            accountLockoutService.recordFailedLoginAttempt(username);
            int remaining = accountLockoutService.getRemainingAttempts(username);

            log.warn(" Login failed for user: {} | {} attempts remaining before lockout", username, remaining);

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.UNAUTHORIZED.value());
            response.put("error", "Invalid username or password");
            if (remaining > 0) {
                response.put("message", "Failed attempt. " + remaining + " attempts remaining before account lockout.");
            } else {
                response.put("message", " Account locked due to too many failed attempts.");
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            log.error(" Unexpected error during login: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            response.put("error", "Internal server error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * POST /riders/register
     * Rate limited to 3 attempts per 10 minutes per IP address.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest registerRequest) {

        String clientIp = clientIpResolver.getClientIp(request);
        int attempts = accountLockoutService.getRegisterAttempts(clientIp);

        log.info(" Register attempt from IP: {} | Attempts: {}", clientIp, attempts + 1);

        // Check if IP has exceeded registration limit (3 per 10 minutes)
        if (attempts >= 3) {
            log.warn(" Registration spam detected from IP: {} (exceeded 3 attempts)", clientIp);
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            response.put("error", "Too many registration attempts");
            response.put("message", "Your IP address has exceeded the registration limit (3 per 10 minutes). Please try again later.");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
        }

        try {
            String username = riderService.registerRider(
                    registerRequest.getUsername(),
                    registerRequest.getPassword(),
                    registerRequest.getRiderType());

            String accessToken = jwtUtil.generateToken(username);
            String refreshToken = refreshTokenService.createRefreshToken(username);

            log.info(" New user registered: {} from IP: {}", username, clientIp);
            return ResponseEntity.ok(new RegisterResponse(accessToken, refreshToken));

        } catch (RuntimeException e) {
            // Record failed attempt on IP
            accountLockoutService.recordFailedRegisterAttempt(clientIp);
            log.warn(" Registration failed from IP: {} | Error: {}", clientIp, e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.BAD_REQUEST.value());
            response.put("error", "Registration failed");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error(" Unexpected error during registration: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            response.put("error", "Internal server error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * POST /riders/refresh
     * Exchange a valid refresh token for new access + refresh tokens.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        String rawRefreshToken = body.get("refreshToken");
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.BAD_REQUEST.value());
            response.put("error", "Missing refresh token");
            return ResponseEntity.badRequest().body(response);
        }
        try {
            String username = refreshTokenService.validateAndRotate(rawRefreshToken);
            String newAccessToken = jwtUtil.generateToken(username);
            String newRefreshToken = refreshTokenService.createRefreshToken(username);

            log.info(" Token refreshed for user: {}", username);
            return ResponseEntity.ok(new LoginResponse(newAccessToken, newRefreshToken));
        } catch (RuntimeException e) {
            log.warn(" Token refresh failed: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.UNAUTHORIZED.value());
            response.put("error", "Invalid or expired refresh token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * POST /riders/logout
     * Revokes all refresh tokens for the current user.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.UNAUTHORIZED.value());
            response.put("error", "Not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        refreshTokenService.revokeAll(username);
        log.info(" User logged out: {}", username);
        return ResponseEntity.ok().body(Map.of("message", "Logged out successfully"));
    }
}