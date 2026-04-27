package leyans.RidersHub.Config.JWT;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import leyans.RidersHub.Service.Auth.TokenBlacklistService;
import leyans.RidersHub.Service.UserDetailsManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsManager userDetailsManager;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Public endpoints — skip auth entirely
        if (path.equals("/riders/login")
                || path.equals("/riders/register")
                || path.equals("/riders/refresh")
                || path.startsWith("/facebook/login")) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        if (header == null || header.trim().isEmpty()) {
            logger.debug("No Authorization header present");
            filterChain.doFilter(request, response);
            return;
        }

        if (!header.startsWith("Bearer ")) {
            logger.warn("Authorization header missing Bearer prefix");
            sendUnauthorized(response, "Malformed authorization header");
            return;
        }

        String token = header.substring(7);

        if (!isValidTokenFormat(token)) {
            logger.warn("Invalid token format — must be 3 JWT parts (header.payload.signature)");
            sendUnauthorized(response, "Invalid token format");
            return;
        }

        // Check blacklist
        String jti = jwtUtil.getJtiFromToken(token);
        if (jti != null && tokenBlacklistService.isTokenBlacklisted(jti)) {
            logger.warn("Revoked token presented: {}", jti);
            sendUnauthorized(response, "Token has been revoked");
            return;
        }

        // Validate signature + expiration
        if (!jwtUtil.isTokenValid(token)) {
            logger.debug("Token validation failed — expired or invalid signature");
            sendUnauthorized(response, "Token is expired or invalid");
            return;
        }

        // Token is good — set authentication in context
        try {
            String username = jwtUtil.getUsernameFromToken(token);
            UserDetails userDetails = userDetailsManager.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
            logger.debug("Token validated for user: {}", username);
        } catch (Exception e) {
            logger.error("Error processing valid token", e);
            sendUnauthorized(response, "Authentication processing error");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }


    private boolean isValidTokenFormat(String token) {
        if (token == null || token.trim().isEmpty()) return false;
        int periodCount = (int) token.chars().filter(ch -> ch == '.').count();
        return periodCount == 2;
    }
}