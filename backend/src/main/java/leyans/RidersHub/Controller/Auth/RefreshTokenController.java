package leyans.RidersHub.Controller.Auth;

import leyans.RidersHub.Config.JWT.JwtUtil;
import leyans.RidersHub.DTO.Request.RefreshTokenRequest;
import leyans.RidersHub.DTO.Response.RefreshTokenResponse;
import leyans.RidersHub.Service.Auth.RefreshTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.HashMap;
import java.util.Map;

/**
 * REFRESH TOKEN ENDPOINT
 *
 * POST /riders/refresh
 * ├─ Input: Refresh token
 * ├─ Validate: Token exists, not expired, not revoked
 * ├─ Output: New access token + new refresh token (rotated)
 * └─ Action: Invalidate old refresh token
 */
@RestController
@RequestMapping("/riders")
public class RefreshTokenController {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenController.class);

    private final RefreshTokenService refreshTokenService;
    private final JwtUtil jwtUtil;

    public RefreshTokenController(
            RefreshTokenService refreshTokenService,
            JwtUtil jwtUtil) {
        this.refreshTokenService = refreshTokenService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshAccessToken(
            @Valid @RequestBody RefreshTokenRequest request) {

        try {
            // 1. Validate refresh token and get username
            String username = refreshTokenService.validateAndRotate(request.getRefreshToken());
            log.info("Refresh token validated for user: {}", username);

            // 2. Generate new access token
            String newAccessToken = jwtUtil.generateToken(username);

            // 3. Generate new refresh token (rotate)
            String newRefreshToken = refreshTokenService.createRefreshToken(username);

            log.info("New tokens issued for user: {}", username);
            return ResponseEntity.ok(
                    new RefreshTokenResponse(newAccessToken, newRefreshToken)
            );

        } catch (RuntimeException e) {
            log.warn("Refresh token validation failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Invalid refresh token", e.getMessage()));
        }
    }

    private Map<String, Object> createErrorResponse(String error, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", 401);
        response.put("error", error);
        response.put("message", message);
        return response;
    }
}