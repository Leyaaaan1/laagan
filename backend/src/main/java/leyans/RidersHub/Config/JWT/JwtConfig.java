package leyans.RidersHub.Config.JWT;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    private static final Logger log = LoggerFactory.getLogger(JwtConfig.class);
    private static final int MINIMUM_SECRET_BYTES = 32; // 256-bit minimum for HS256

    private String secret;
    private long expiration;
    private long refreshExpirationMs;     // 7 days

    @PostConstruct
    public void validate() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT secret is not configured. Set the JWT_SECRET environment variable.");
        }
        if (secret.getBytes().length < MINIMUM_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT secret is too short (" + secret.getBytes().length + " bytes). " +
                            "Minimum required: " + MINIMUM_SECRET_BYTES + " bytes (256 bits). " +
                            "Generate one with: openssl rand -hex 32");
        }
        log.info("JWT configuration validated — " +
                        "secret length: {} bytes, " +
                        "access token TTL: {}ms (15 min), " +
                        "refresh token TTL: {}ms (7 days)",
                secret.getBytes().length, expiration, refreshExpirationMs);
    }

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public long getExpiration() { return expiration; }
    public void setExpiration(long expiration) { this.expiration = expiration; }
    public long getRefreshExpirationMs() { return refreshExpirationMs; }
    public void setRefreshExpirationMs(long refreshExpirationMs) {
        this.refreshExpirationMs = refreshExpirationMs;
    }
}