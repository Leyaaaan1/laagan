package leyans.RidersHub.Config.JWT;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.security.SecureRandom;
import java.util.Base64;
import java.security.MessageDigest;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    @Autowired
    private JwtConfig jwtConfig;

    private static final SecureRandom secureRandom = new SecureRandom();

    private Key getSigningKey() {
        byte[] keyBytes = jwtConfig.getSecret().getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateRefreshToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String hashRefreshToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * UPDATED: Generate access token WITH JTI (JWT ID) for revocation
     */
    public String generateToken(String username) {
        String jti = UUID.randomUUID().toString();
        return Jwts.builder()
                .setId(jti)                    // ← ADD THIS: Unique token ID for revocation
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtConfig.getExpiration()))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * NEW: Extract JTI from token
     */
    public String getJtiFromToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getId();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * NEW: Get token expiration time
     */
    public long getTokenExpirationMs(String token) {
        try {
            Date expiration = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration();
            return expiration.getTime() - System.currentTimeMillis();
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Returns true only if the token signature is valid AND it is not expired.
     */
    public boolean isTokenValid(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("JWT rejected — token expired for subject: {}", e.getClaims().getSubject());
        } catch (io.jsonwebtoken.security.SignatureException e) {
            log.warn("JWT rejected — invalid signature. Possible token tampering attempt.");
        } catch (JwtException e) {
            log.warn("JWT rejected — malformed or unsupported token: {}", e.getMessage());
        } catch (Exception e) {
            log.error("JWT validation error — unexpected exception", e);
        }
        return false;
    }
}