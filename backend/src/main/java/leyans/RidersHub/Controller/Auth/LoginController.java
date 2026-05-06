
package leyans.RidersHub.Controller.Auth;

import leyans.RidersHub.Config.Security.ClientIpResolver;
import leyans.RidersHub.DTO.Request.LoginRequest;
import leyans.RidersHub.DTO.Request.RegisterRequest;
import leyans.RidersHub.DTO.Response.LoginResponse;
import leyans.RidersHub.DTO.Response.RegisterResponse;
import leyans.RidersHub.Service.Auth.LoginService;
import leyans.RidersHub.Service.Auth.TokenBlacklistService;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/riders")
public class LoginController {

    private static final Logger log = LoggerFactory.getLogger(LoginController.class);

    private final LoginService loginService;
    private final TokenBlacklistService tokenBlacklistService;
    private final ClientIpResolver clientIpResolver;

    public LoginController(
            LoginService loginService,
            TokenBlacklistService tokenBlacklistService,
            ClientIpResolver clientIpResolver) {
        this.loginService = loginService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.clientIpResolver = clientIpResolver;
    }

    @PostMapping("/login")
    @RateLimiter(name = "login", fallbackMethod = "loginFallback")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = loginService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createResponse(HttpStatus.UNAUTHORIZED.value(), "Invalid credentials", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createResponse(HttpStatus.FORBIDDEN.value(), "Account locked", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Login failed", e.getMessage()));
        }
    }

    public ResponseEntity<?> loginFallback(LoginRequest loginRequest, Exception ex) {
        log.warn("⚠️  Rate limit exceeded for login endpoint: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(createResponse(429, "Too many login attempts",
                        "Login rate limit exceeded. Please try again in 1 minute."));
    }

    @PostMapping("/register")
    @RateLimiter(name = "register", fallbackMethod = "registerFallback")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest,
                                      HttpServletRequest request) {
        try {
            String clientIp = clientIpResolver.getClientIp(request);
            RegisterResponse response = loginService.register(registerRequest, clientIp);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createResponse(HttpStatus.BAD_REQUEST.value(), "Registration failed", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Registration error", e.getMessage()));
        }
    }

    public ResponseEntity<?> registerFallback(RegisterRequest registerRequest,
                                              HttpServletRequest request, Exception ex) {
        log.warn("⚠️  Rate limit exceeded for register endpoint: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(createResponse(429, "Too many registration attempts",
                        "Registration rate limit exceeded. Please try again in 10 minutes."));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        try {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                loginService.logout(token, tokenBlacklistService);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", 200);
            response.put("message", "Logged out successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error during logout", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createResponse(500, "Logout failed", e.getMessage()));
        }
    }

    private Map<String, Object> createResponse(int status, String error, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("error", error);
        response.put("message", message);
        return response;
    }
}