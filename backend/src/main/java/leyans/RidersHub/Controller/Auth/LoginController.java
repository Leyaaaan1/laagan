
package leyans.RidersHub.Controller.Auth;

import leyans.RidersHub.Config.Security.ClientIpResolver;
import leyans.RidersHub.DTO.Request.LoginRequest;
import leyans.RidersHub.DTO.Request.RegisterRequest;
import leyans.RidersHub.DTO.Response.LoginResponse;
import leyans.RidersHub.DTO.Response.RegisterResponse;
import leyans.RidersHub.ExceptionHandler.RateLimitExceededException;
import leyans.RidersHub.Service.Auth.LoginService;
import leyans.RidersHub.Service.Auth.TokenBlacklistService;
import leyans.RidersHub.Service.UserDetailsManager;
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

    public LoginController(LoginService loginService,
                           TokenBlacklistService tokenBlacklistService,
                           ClientIpResolver clientIpResolver, UserDetailsManager userDetailsManager) {
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
}