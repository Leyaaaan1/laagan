package leyans.RidersHub.Config.JWT;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    private static final Logger log = LoggerFactory.getLogger(JwtConfig.class);
    private static final int MINIMUM_SECRET_BYTES = 32; // 256-bit minimum for HS256


    private static final Set<String> KNOWN_WEAK_SECRETS = Set.of(
            "secret", "changeme", "password", "jwt_secret", "mysecret",
            "yoursecretkey", "supersecret", "defaultsecret"
    );

    private String secret;
    private long expiration;
    private long refreshExpirationMs;

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


        if (KNOWN_WEAK_SECRETS.contains(secret.toLowerCase())) {
            throw new IllegalStateException(
                    "JWT secret is a known weak value: '" + secret + "'. " +
                            "Generate a strong secret with: openssl rand -hex 32");
        }


        boolean allSame = secret.chars().distinct().count() == 1;
        if (allSame) {
            throw new IllegalStateException(
                    "JWT secret has no entropy (all characters are identical). " +
                            "Generate a strong secret with: openssl rand -hex 32");
        }

        log.info("JWT configuration validated — " +
                        "secret length: {} bytes, " +
                        "access token TTL: {}ms, " +
                        "refresh token TTL: {}ms",
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