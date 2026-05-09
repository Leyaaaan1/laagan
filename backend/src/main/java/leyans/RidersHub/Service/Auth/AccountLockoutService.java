
package leyans.RidersHub.Service.Auth;

import leyans.RidersHub.ExceptionHandler.RedisUnavailableException;
import leyans.RidersHub.Utility.AppLogger;
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

    /**     * Record a failed login attempt for a username.     * If max attempts exceeded, lock the account.     *
     * ⚠️ PROTECTED: If Redis is down, log warning but don't block login flow     */
    public void recordFailedLoginAttempt(String username) {
        String key = FAILED_ATTEMPTS_KEY_PREFIX + username;

        try {
            // Increment failed attempts
            Integer attempts = redisTemplate.opsForValue().get(key);
            if (attempts == null) {
                attempts = 0;
            }
            attempts++;

            // Set with 15-minute TTL
            redisTemplate.opsForValue().set(key, attempts, 15, TimeUnit.MINUTES);

            log.warn(" Login failed for user: {} | Attempt #{}", username, attempts);

            // Lock account if threshold exceeded
            if (attempts >= maxFailedAttempts) {
                lockAccount(username);
            }
        } catch (Exception e) {
            AppLogger.warn(this.getClass(), "Redis unavailable - failed to record login attempt for: " + username, e);
            log.warn("Redis connection failed while recording failed login attempt for: {}", username, e);
            // ⚠️ GRACEFUL DEGRADATION: Allow login process to continue
            // The account won't be tracked, but the app stays operational
        }
    }

    /**     * Record a failed registration attempt for an IP address.     *
     * ⚠️ PROTECTED: If Redis is down, log warning but don't block registration     */
    public void recordFailedRegisterAttempt(String ipAddress) {
        String key = FAILED_ATTEMPTS_IP_PREFIX + ipAddress;

        try {
            Integer attempts = redisTemplate.opsForValue().get(key);
            if (attempts == null) {
                attempts = 0;
            }
            attempts++;

            // Set with 10-minute TTL
            redisTemplate.opsForValue().set(key, attempts, 10, TimeUnit.MINUTES);

            log.warn(" Register failed for IP: {} | Attempt #{}", ipAddress, attempts);
        } catch (Exception e) {
            AppLogger.warn(this.getClass(), "Redis unavailable - failed to record register attempt for: " + ipAddress, e);
            log.warn("Redis connection failed while recording failed register attempt for: {}", ipAddress, e);
            // ⚠️ GRACEFUL DEGRADATION: Allow registration to continue
        }
    }

    /**     * Check if account is locked.     *
     * ⚠️ PROTECTED: If Redis is down, FAIL SECURE by assuming account is NOT locked     *              (Allow login but with security monitoring disabled)     */
    public boolean isAccountLocked(String username) {
        String lockKey = LOCKOUT_KEY_PREFIX + username;

        try {
            Boolean locked = redisTemplate.hasKey(lockKey);

            if (Boolean.TRUE.equals(locked)) {
                log.warn(" Account locked: {}", username);
                return true;
            }
            return false;
        } catch (Exception e) {
            AppLogger.warn(this.getClass(), "Redis unavailable - cannot check if account is locked: " + username, e);
            log.warn("Redis connection failed while checking if account is locked: {}", username, e);
            // ⚠️ FAIL SECURE: If Redis is down, assume account is NOT locked
            // This prioritizes availability over strict security
            return false;
        }
    }

    /**     * Check if IP has exceeded registration limit.     *
     * ⚠️ PROTECTED: If Redis is down, return 0 (allow registration)     */
    public int getRegisterAttempts(String ipAddress) {
        String key = FAILED_ATTEMPTS_IP_PREFIX + ipAddress;

        try {
            Integer attempts = redisTemplate.opsForValue().get(key);
            return attempts != null ? attempts : 0;
        } catch (Exception e) {
            AppLogger.warn(this.getClass(), "Redis unavailable - cannot get register attempts for: " + ipAddress, e);
            log.warn("Redis connection failed while getting register attempts for: {}", ipAddress, e);
            // ⚠️ GRACEFUL DEGRADATION: Return 0 to allow registration
            return 0;
        }
    }

    /**     * Get remaining failed attempts before lockout.     *
     * ⚠️ PROTECTED: If Redis is down, return max attempts (no limit)     */
    public int getRemainingAttempts(String username) {
        String key = FAILED_ATTEMPTS_KEY_PREFIX + username;

        try {
            Integer attempts = redisTemplate.opsForValue().get(key);
            attempts = attempts != null ? attempts : 0;
            return Math.max(0, maxFailedAttempts - attempts);
        } catch (Exception e) {
            AppLogger.warn(this.getClass(), "Redis unavailable - cannot get remaining attempts for: " + username, e);
            log.warn("Redis connection failed while getting remaining attempts for: {}", username, e);
            // ⚠️ GRACEFUL DEGRADATION: Return max attempts
            return maxFailedAttempts;
        }
    }

    /**     * Lock account for configured duration.     *
     * ⚠️ PROTECTED: If Redis is down, log warning but don't throw     */
    private void lockAccount(String username) {
        String lockKey = LOCKOUT_KEY_PREFIX + username;

        try {
            redisTemplate.opsForValue().set(lockKey, 1, lockoutDurationMinutes, TimeUnit.MINUTES);
            log.error(" Account locked: {} for {} minutes", username, lockoutDurationMinutes);
        } catch (Exception e) {
            AppLogger.error(this.getClass(), "Redis unavailable - failed to lock account: " + username, e);
            log.error("Redis connection failed while locking account: {}", username, e);
            // ⚠️ GRACEFUL DEGRADATION: Account won't be locked, but app stays operational
        }
    }

    /**     * Reset failed attempts on successful login.     *
     * ⚠️ PROTECTED: If Redis is down, log warning but don't throw     */
    public void resetFailedAttempts(String username) {
        String key = FAILED_ATTEMPTS_KEY_PREFIX + username;

        try {
            redisTemplate.delete(key);
            log.info(" Login successful - attempts reset for: {}", username);
        } catch (Exception e) {
            AppLogger.warn(this.getClass(), "Redis unavailable - failed to reset attempts for: " + username, e);
            log.warn("Redis connection failed while resetting failed attempts for: {}", username, e);
            // ⚠️ GRACEFUL DEGRADATION: Attempts won't be reset, but login succeeds
        }
    }
}