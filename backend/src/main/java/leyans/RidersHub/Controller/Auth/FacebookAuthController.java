package leyans.RidersHub.Controller.Auth;

import leyans.RidersHub.Config.JWT.JwtUtil;
import leyans.RidersHub.Service.Auth.FacebookAccountService;
import leyans.RidersHub.model.auth.FacebookAccount;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/facebook")
public class FacebookAuthController {

    @Autowired
    private FacebookAccountService facebookAccountService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> facebookLogin(@RequestBody Map<String, String> request) {
        try {
            String accessToken = request.get("accessToken");

            if (accessToken == null || accessToken.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Access token is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            FacebookAccount account = facebookAccountService.loginOrCreateFacebookAccount(accessToken);

            // Generate JWT token using the Rider's ID or unique identifier
            String token = jwtUtil.generateToken(account.getRider().getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("username", account.getRider().getUsername());
            response.put("facebookId", account.getUsername());
            response.put("profilePictureUrl", account.getProfilePictureUrl());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}