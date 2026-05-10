package leyans.RidersHub.Utility;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import leyans.RidersHub.Config.JWT.JwtUtil;
import leyans.RidersHub.Service.Auth.RefreshTokenService;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class FacebookOAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    public FacebookOAuth2SuccessHandler(JwtUtil jwtUtil, RefreshTokenService refreshTokenService) {
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email    = oAuth2User.getAttribute("email");
        String name     = oAuth2User.getAttribute("name");
        String username = (email != null) ? email : name;

        String accessToken  = jwtUtil.generateToken(username);
        String refreshToken = refreshTokenService.createRefreshToken(username);

        // ✅ Redirect to app deep link with tokens as query params.
        // InAppBrowser.openAuth() intercepts ridershub:// and closes,
        // returning { type: 'success', url: 'ridershub://oauth2/callback?...' }.
        // The app reads tokens from the URL — no second fetch() needed.
        String deepLink = "ridershub://oauth2/callback"
                + "?accessToken="  + URLEncoder.encode(accessToken,  StandardCharsets.UTF_8)
                + "&refreshToken=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8)
                + "&username="     + URLEncoder.encode(username,     StandardCharsets.UTF_8);

        getRedirectStrategy().sendRedirect(request, response, deepLink);
    }
}