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
    private TokenBlacklistService tokenBlacklistService;  // ← ADD THIS

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // ✅ Skip auth for login, register, refresh endpoints
        if (path.equals("/riders/login")
                || path.equals("/riders/register")
                || path.equals("/riders/refresh")
                || path.startsWith("/facebook/login")) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        // ✅ If no header or empty, proceed without auth
        if (header == null || header.trim().isEmpty()) {
            logger.debug("No Authorization header present");
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ Check for Bearer prefix
        if (!header.startsWith("Bearer ")) {
            logger.warn("Authorization header missing Bearer prefix");
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        // ✅ Validate token format before parsing
        if (!isValidTokenFormat(token)) {
            logger.warn("Invalid token format — must be 3 JWT parts (header.payload.signature)");
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ Check if token is blacklisted
        String jti = jwtUtil.getJtiFromToken(token);  // ← ADD THIS
        if (jti != null && tokenBlacklistService.isTokenBlacklisted(jti)) {  // ← ADD THIS
            logger.warn("Token is blacklisted (revoked): {}", jti);
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ Validate token signature and expiration
        if (jwtUtil.isTokenValid(token)) {
            try {
                String username = jwtUtil.getUsernameFromToken(token);
                UserDetails userDetails = userDetailsManager.loadUserByUsername(username);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.debug("Token validated for user: {}", username);
            } catch (Exception e) {
                logger.error("Error processing valid token", e);
            }
        } else {
            logger.debug("Token validation failed — may be expired or invalid");
        }

        filterChain.doFilter(request, response);
    }

    /**
     * ✅ Validate that token has correct JWT format: header.payload.signature
     */
    private boolean isValidTokenFormat(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        int periodCount = (int) token.chars().filter(ch -> ch == '.').count();
        return periodCount == 2;
    }
}