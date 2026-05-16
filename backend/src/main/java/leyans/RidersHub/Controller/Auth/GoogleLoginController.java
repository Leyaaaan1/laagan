package leyans.RidersHub.Controller.Auth;

import jakarta.servlet.http.HttpServletRequest;
import leyans.RidersHub.Config.Security.ClientIpResolver;
import leyans.RidersHub.DTO.Response.LoginResponse;
import leyans.RidersHub.Service.Auth.GoogleLoginService;
import leyans.RidersHub.Utility.Verifier.GoogleTokenVerifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
@RestController
@RequestMapping("/riders")
public class GoogleLoginController {

    private final GoogleLoginService googleLoginService;
    private final ClientIpResolver clientIpResolver;  // ← inject directly, same as LoginController

    public GoogleLoginController(GoogleLoginService googleLoginService,
                                 ClientIpResolver clientIpResolver) {
        this.googleLoginService = googleLoginService;
        this.clientIpResolver = clientIpResolver;
    }

    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body,
                                         HttpServletRequest request) {
        try {
            String idToken = body.get("idToken");
            String clientIp = clientIpResolver.getClientIp(request);  // ← extract here

            LoginResponse response = googleLoginService.loginWithGoogle(idToken, clientIp);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", 400, "error", "Bad request", "message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", 401, "error", "Invalid token", "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", 500, "error", "Login failed", "message", e.getMessage()));
        }
    }


    public ResponseEntity<?> googleLoginFallback(Map<String, String> body, Exception ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("message", "Too many attempts. Try again later."));
    }
}