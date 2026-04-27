package leyans.RidersHub.Service.Auth;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.concurrent.TimeUnit;

/**
 * TOKEN BLACKLIST SERVICE
 *
 * Stores revoked access token JTIs in Redis.
 * On logout: Add access token JTI to blacklist
 * On every request: Check if token JTI is blacklisted
 */
@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);
    private static final String BLACKLIST_PREFIX = "ridershub:token:blacklist:";

    private final RedisTemplate<String, String> redisTemplate;

    // CHANGED: Added @Qualifier("ridersHubRedisTemplate") to explicitly pick our
    // custom bean. Without this, Spring sees two RedisTemplate<String, String>
    // candidates — ours and Spring Boot's own "stringRedisTemplate" — and fails
    // with a NoUniqueBeanDefinitionException.
    public TokenBlacklistService(
            @Qualifier("ridersHubRedisTemplate") RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Add a token JTI to the blacklist.
     * TTL = remaining token lifetime so the key auto-expires.
     */
    public void blacklistToken(String jti, long expirationMs) {
        String key = BLACKLIST_PREFIX + jti;
        try {
            redisTemplate.opsForValue().set(key, "revoked", expirationMs, TimeUnit.MILLISECONDS);
            log.debug("Token blacklisted: {}", jti);
        } catch (Exception e) {
            log.error("Failed to blacklist token: {}", jti, e);
            // Don't fail the logout — continue anyway
        }
    }

    /**
     * Check if a token JTI is blacklisted.
     * Returns true if revoked, false if still valid.
     */
    public boolean isTokenBlacklisted(String jti) {
        String key = BLACKLIST_PREFIX + jti;
        try {
            Boolean exists = redisTemplate.hasKey(key);
            return exists != null && exists;
        } catch (Exception e) {
            log.warn("Error checking token blacklist for: {}", jti, e);
            // Fail secure: treat as invalid if Redis is unreachable
            return true;
        }
    }

    /**
     * Manually revoke a token (logout, account deletion, etc.)
     */
    public void revokeToken(String jti, long remainingTimeMs) {
        if (remainingTimeMs > 0) {
            blacklistToken(jti, remainingTimeMs);
        }
    }
}