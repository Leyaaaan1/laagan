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
import leyans.RidersHub.Service.Auth.TokenBlacklistService;
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
    private final TokenBlacklistService tokenBlacklistService;


    public LoginController(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            RiderService riderService,
            RefreshTokenService refreshTokenService,
            AccountLockoutService accountLockoutService,
            ClientIpResolver clientIpResolver,
            HttpServletRequest request, TokenBlacklistService tokenBlacklistService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.riderService = riderService;
        this.refreshTokenService = refreshTokenService;
        this.accountLockoutService = accountLockoutService;
        this.clientIpResolver = clientIpResolver;
        this.request = request;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        String username = loginRequest.getUsername();
        log.info(" Login attempt for user: {}", username);

        // Check if account is locked
        if (accountLockoutService.isAccountLocked(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createResponse(HttpStatus.FORBIDDEN.value(), "Account temporarily locked",
                            "Account is locked due to too many failed login attempts. Please try again in 15 minutes."));
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, loginRequest.getPassword()));

            String accessToken = jwtUtil.generateToken(username);
            String refreshToken = refreshTokenService.createRefreshToken(username);
            accountLockoutService.resetFailedAttempts(username);

            log.info(" Login successful for user: {}", username);
            return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken));

        } catch (BadCredentialsException e) {
            accountLockoutService.recordFailedLoginAttempt(username);
            int remaining = accountLockoutService.getRemainingAttempts(username);
            log.warn(" Login failed for user: {} | {} attempts remaining", username, remaining);

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createResponse(HttpStatus.UNAUTHORIZED.value(), "Invalid username or password",
                            remaining > 0 ? "Failed attempt. " + remaining + " attempts remaining before account lockout."
                                    : "Account locked due to too many failed attempts."));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        String clientIp = clientIpResolver.getClientIp(request);
        log.info(" Register attempt from IP: {}", clientIp);

        try {
            String username = riderService.registerRiderWithValidation(
                    registerRequest.getUsername(),
                    registerRequest.getPassword(),
                    registerRequest.getRiderType(),
                    clientIp,
                    accountLockoutService);

            String accessToken = jwtUtil.generateToken(username);
            String refreshToken = refreshTokenService.createRefreshToken(username);

            log.info(" New user registered: {} from IP: {}", username, clientIp);
            return ResponseEntity.ok(new RegisterResponse(accessToken, refreshToken));

        } catch (RuntimeException e) {
            accountLockoutService.recordFailedRegisterAttempt(clientIp);
            log.warn(" Registration failed from IP: {} | Error: {}", clientIp, e.getMessage());

            return ResponseEntity.badRequest()
                    .body(createResponse(HttpStatus.BAD_REQUEST.value(), "Registration failed", e.getMessage()));
        }
    }

    // Helper method to reduce boilerplate
    private Map<String, Object> createResponse(int status, String error, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("error", error);
        response.put("message", message);
        return response;
}
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        try {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);

                // Blacklist the access token
                String jti = jwtUtil.getJtiFromToken(token);
                if (jti != null) {
                    long remainingMs = jwtUtil.getTokenExpirationMs(token);
                    // Inject TokenBlacklistService in the controller constructor
                    tokenBlacklistService.blacklistToken(jti, Math.max(remainingMs, 1000));
                }

                // Get authenticated user and revoke all refresh tokens
                String username = jwtUtil.getUsernameFromToken(token);
                refreshTokenService.revokeAll(username);

                log.info("User logged out successfully: {}", username);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", 200);
            response.put("message", "Logged out successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error during logout", e);
            return ResponseEntity.status(500)
                    .body(createResponse(500, "Logout failed", e.getMessage()));
        }
    }
}