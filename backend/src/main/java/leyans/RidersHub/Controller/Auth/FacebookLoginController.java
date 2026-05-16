package leyans.RidersHub.Controller.Auth;


import leyans.RidersHub.Config.JWT.JwtUtil;
import leyans.RidersHub.Service.Auth.RefreshTokenService;
import leyans.RidersHub.Utility.Verifier.FacebookTokenVerifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/riders")
public class FacebookLoginController {

    private final FacebookTokenVerifier facebookTokenVerifier;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    public FacebookLoginController(
            FacebookTokenVerifier facebookTokenVerifier, JwtUtil jwtUtil,
            RefreshTokenService refreshTokenService) {
        this.facebookTokenVerifier = facebookTokenVerifier;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/facebook-login")
    public ResponseEntity<?> facebookLogin(@RequestBody Map<String, String> body) {
        String fbAccessToken = body.get("accessToken");

        if (fbAccessToken == null || fbAccessToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Missing Facebook access token"));
        }

        // Verify with Facebook and find-or-create the rider
        Map<String, String> userInfo = facebookTokenVerifier.verify(fbAccessToken);
        if (userInfo == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Invalid Facebook token"));
        }

        String username = userInfo.get("username");

        // Issue your own JWT tokens
        String accessToken  = jwtUtil.generateToken(username);
        String refreshToken = refreshTokenService.createRefreshToken(username);

        return ResponseEntity.ok(Map.of(
                "accessToken",  accessToken,
                "refreshToken", refreshToken,
                "username",     username
        ));
    }
}