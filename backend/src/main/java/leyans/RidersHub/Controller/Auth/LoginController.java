package leyans.RidersHub.Controller.Auth;

import jakarta.servlet.http.HttpServletResponse;
import leyans.RidersHub.Config.Security.ClientIpResolver;
import leyans.RidersHub.DTO.Request.LoginRequest;
import leyans.RidersHub.DTO.Request.RegisterRequest;
import leyans.RidersHub.DTO.Response.LoginResponse;
import leyans.RidersHub.DTO.Response.RegisterResponse;
import leyans.RidersHub.ExceptionHandler.RateLimitExceededException;
import leyans.RidersHub.Service.Auth.LoginService;
import leyans.RidersHub.Service.Auth.TokenBlacklistService;
import leyans.RidersHub.Service.UserDetailsManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;


@RestController
@RequestMapping("/riders")
public class LoginController {

    private final LoginService loginService;
    private final TokenBlacklistService tokenBlacklistService;
    private final ClientIpResolver clientIpResolver;
    private final UserDetailsManager userDetailsManager;

    // Injected from application.properties → baseurl=${tokenBaseUrl}
    // Set tokenBaseUrl=http://192.168.1.51:8080 in your .env
    @Value("${baseurl}")
    private String baseUrl;

    public LoginController(LoginService loginService,
                           TokenBlacklistService tokenBlacklistService,
                           ClientIpResolver clientIpResolver,
                           UserDetailsManager userDetailsManager) {
        this.loginService = loginService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.clientIpResolver = clientIpResolver;
        this.userDetailsManager = userDetailsManager;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest,
                                   HttpServletRequest request) {
        try {
            String clientIp = clientIpResolver.getClientIp(request);
            LoginResponse response = loginService.login(loginRequest, clientIp);
            return ResponseEntity.ok(response);
        } catch (RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(createResponse(429, "Too many attempts", e.getMessage()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createResponse(401, "Invalid credentials", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createResponse(403, "Account locked", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createResponse(500, "Login failed", e.getMessage()));
        }
    }

    /**
     * Supabase redirects here after email confirmation.
     *
     * PKCE flow (default for new projects):
     *   GET /riders/confirm?token_hash=xxx&type=signup
     *
     * Implicit flow (legacy / PKCE disabled):
     *   GET /riders/confirm  (with #access_token=... in the fragment — handled by JS below)
     *   GET /riders/confirm?access_token=xxx&type=signup  (after the JS redirect)
     *
     * We forward whichever token arrived to the app via a deep link:
     *   ridershub://verify?token_hash=xxx&type=signup   ← PKCE
     *   ridershub://verify?access_token=xxx&type=signup ← implicit
     */
    @GetMapping("/confirm")
    public void confirmRedirect(
            // PKCE — Supabase sends these two
            @RequestParam(name = "token_hash",   required = false) String tokenHash,
            // Implicit — either from Supabase directly or forwarded by the JS fragment handler below
            @RequestParam(name = "access_token", required = false) String accessToken,
            @RequestParam(name = "type",         required = false, defaultValue = "signup") String type,
            HttpServletResponse response) throws Exception {

        // ── Neither token present: fragment flow — serve a tiny JS page ──────
        // Supabase puts the access_token in the URL hash (#access_token=...)
        // which servers never see. The page reads it and redirects back here
        // as a proper query param.
        if ((tokenHash == null || tokenHash.isBlank()) &&
                (accessToken == null || accessToken.isBlank())) {

            response.setContentType("text/html");
            response.getWriter().write("""
                <html><body>
                <script>
                  var hash = window.location.hash.substring(1);
                  var params = new URLSearchParams(hash);
                  var at = params.get('access_token');
                  if (at) {
                    window.location.href = '/riders/confirm?access_token='
                        + encodeURIComponent(at)
                        + '&type=' + (params.get('type') || 'signup');
                  } else {
                    document.body.innerText = 'Verification link is invalid or expired.';
                  }
                </script>
                </body></html>
                """);
            return;
        }

        // ── Build deep link based on whichever token we received ─────────────
        String deepLink;
        if (tokenHash != null && !tokenHash.isBlank()) {
            // PKCE flow — forward token_hash + type
            deepLink = "ridershub://verify"
                    + "?token_hash=" + java.net.URLEncoder.encode(tokenHash, java.nio.charset.StandardCharsets.UTF_8)
                    + "&type="       + java.net.URLEncoder.encode(type,      java.nio.charset.StandardCharsets.UTF_8);
        } else {
            // Implicit flow — forward access_token + type
            deepLink = "ridershub://verify"
                    + "?access_token=" + java.net.URLEncoder.encode(accessToken, java.nio.charset.StandardCharsets.UTF_8)
                    + "&type="         + java.net.URLEncoder.encode(type,        java.nio.charset.StandardCharsets.UTF_8);
        }

        System.out.println("✅ [/confirm] Redirecting to deep link: " + deepLink.substring(0, Math.min(deepLink.length(), 80)));
        response.sendRedirect(deepLink);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest,
                                      HttpServletRequest request) {
        try {
            String clientIp = clientIpResolver.getClientIp(request);
            RegisterResponse response = loginService.register(registerRequest, clientIp);
            return ResponseEntity.ok(response);
        } catch (RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(createResponse(429, "Too many attempts", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createResponse(400, "Registration failed", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createResponse(500, "Registration error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        try {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                loginService.logout(header.substring(7), tokenBlacklistService);
            }
            return ResponseEntity.ok(Map.of("status", 200, "message", "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createResponse(500, "Logout failed", e.getMessage()));
        }
    }

    private Map<String, Object> createResponse(int status, String error, String message) {
        return Map.of("status", status, "error", error, "message", message);
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        try {
            String rawToken = request.getHeader("Authorization").substring(7);
            userDetailsManager.deleteAccount(userDetails.getUsername(), rawToken);
            return ResponseEntity.ok(Map.of("status", 200, "message", "Account successfully deleted."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", 400, "error", "Delete failed", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", 500, "error", "Server error", "message", "An unexpected error occurred."));
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(
            @RequestParam(required = false) String accessToken,
            @RequestParam(name = "token_hash", required = false) String tokenHash,
            @RequestParam(required = false, defaultValue = "signup") String type,
            HttpServletRequest request) {
        try {
            if (accessToken == null && tokenHash == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createResponse(400, "Verification failed",
                                "No verification token provided."));
            }
            String clientIp = clientIpResolver.getClientIp(request);
            LoginResponse response = loginService.verifyEmail(accessToken, tokenHash, type, clientIp);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createResponse(400, "Verification failed", e.getMessage()));
        }
    }
}