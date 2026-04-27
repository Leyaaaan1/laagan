package leyans.RidersHub.Service.Auth;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.TimeUnit;

@Service
public class AccountLockoutService {

    private static final Logger log = LoggerFactory.getLogger(AccountLockoutService.class);
    private static final String FAILED_ATTEMPTS_KEY_PREFIX = "login:failed:";
    private static final String LOCKOUT_KEY_PREFIX = "login:locked:";
    private static final String FAILED_ATTEMPTS_IP_PREFIX = "register:failed:";

    @Autowired
    @Qualifier("redisTemplateInteger")
    private RedisTemplate<String, Integer> redisTemplate;

    @Value("${security.lockout.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${security.lockout.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

    /**
     * Record a failed login attempt for a username.
     * If max attempts exceeded, lock the account.
     */
    public void recordFailedLoginAttempt(String username) {
        String key = FAILED_ATTEMPTS_KEY_PREFIX + username;

        // Increment failed attempts
        Integer attempts = redisTemplate.opsForValue().get(key);
        if (attempts == null) {
            attempts = 0;
        }
        attempts++;

        // Set with 15-minute TTL (attempts reset after 15 min of inactivity)
        redisTemplate.opsForValue().set(key, attempts, 15, TimeUnit.MINUTES);

        log.warn("❌ Login failed for user: {} | Attempt #{}", username, attempts);

        // Lock account if threshold exceeded
        if (attempts >= maxFailedAttempts) {
            lockAccount(username);
        }
    }

    /**
     * Record a failed registration attempt for an IP address.
     */
    public void recordFailedRegisterAttempt(String ipAddress) {
        String key = FAILED_ATTEMPTS_IP_PREFIX + ipAddress;

        Integer attempts = redisTemplate.opsForValue().get(key);
        if (attempts == null) {
            attempts = 0;
        }
        attempts++;

        // Set with 10-minute TTL
        redisTemplate.opsForValue().set(key, attempts, 10, TimeUnit.MINUTES);

        log.warn("❌ Register failed for IP: {} | Attempt #{}", ipAddress, attempts);
    }

    /**
     * Check if account is locked.
     */
    public boolean isAccountLocked(String username) {
        String lockKey = LOCKOUT_KEY_PREFIX + username;
        Boolean locked = redisTemplate.hasKey(lockKey);

        if (Boolean.TRUE.equals(locked)) {
            log.warn("🔒 Account locked: {}", username);
            return true;
        }
        return false;
    }

    /**
     * Check if IP has exceeded registration limit.
     */
    public int getRegisterAttempts(String ipAddress) {
        String key = FAILED_ATTEMPTS_IP_PREFIX + ipAddress;
        Integer attempts = redisTemplate.opsForValue().get(key);
        return attempts != null ? attempts : 0;
    }

    /**
     * Get remaining failed attempts before lockout.
     */
    public int getRemainingAttempts(String username) {
        String key = FAILED_ATTEMPTS_KEY_PREFIX + username;
        Integer attempts = redisTemplate.opsForValue().get(key);
        attempts = attempts != null ? attempts : 0;
        return Math.max(0, maxFailedAttempts - attempts);
    }

    /**
     * Lock account for configured duration.
     */
    private void lockAccount(String username) {
        String lockKey = LOCKOUT_KEY_PREFIX + username;
        redisTemplate.opsForValue().set(lockKey, 1, lockoutDurationMinutes, TimeUnit.MINUTES);
        log.error("🔒 Account locked: {} for {} minutes", username, lockoutDurationMinutes);
    }

    /**
     * Reset failed attempts on successful login.
     */
    public void resetFailedAttempts(String username) {
        String key = FAILED_ATTEMPTS_KEY_PREFIX + username;
        redisTemplate.delete(key);
        log.info("✅ Login successful - attempts reset for: {}", username);
    }
}