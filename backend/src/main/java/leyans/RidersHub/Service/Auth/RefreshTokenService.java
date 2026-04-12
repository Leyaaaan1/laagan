package leyans.RidersHub.Service.Auth;


import jakarta.transaction.Transactional;
import leyans.RidersHub.Config.JWT.JwtUtil;
import leyans.RidersHub.Repository.Auth.RefreshTokenRepository;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.auth.RefreshToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);

    private final RefreshTokenRepository refreshTokenRepository;
    private final RiderUtil riderUtil;
    private final JwtUtil jwtUtil;

    @Value("${jwt.refresh-expiration-ms:604800000}") // 7 days default
    private long refreshExpirationMs;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               RiderUtil riderUtil, JwtUtil jwtUtil) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.riderUtil = riderUtil;
        this.jwtUtil = jwtUtil;
    }

    /** Creates and persists a new refresh token for the given username. Returns the RAW token. */
    @Transactional
    public String createRefreshToken(String username) {
        Rider rider = riderUtil.findRiderByUsername(username);

        String rawToken = jwtUtil.generateRefreshToken();
        String tokenHash = jwtUtil.hashRefreshToken(rawToken);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash(tokenHash);
        refreshToken.setRider(rider);
        refreshToken.setExpiresAt(Instant.now().plusMillis(refreshExpirationMs));
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);
        log.debug("Refresh token created for rider: {}", username);

        return rawToken; // Return raw — only time it's ever in plaintext
    }

    /** Validates the raw token, returns the username if valid, throws otherwise. */
    @Transactional
    public String validateAndRotate(String rawToken) {
        String tokenHash = jwtUtil.hashRefreshToken(rawToken);

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (stored.isRevoked()) {
            // Possible token reuse attack — revoke all tokens for this user
            log.warn("Revoked refresh token reuse detected for rider: {}. Revoking all tokens.",
                    stored.getRider().getUsername());
            refreshTokenRepository.revokeAllByRider(stored.getRider());
            throw new RuntimeException("Refresh token has been revoked");
        }

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            throw new RuntimeException("Refresh token has expired");
        }

        // Rotate: revoke the used token, issue a new one (next call to createRefreshToken)
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return stored.getRider().getUsername();
    }

    /** Revokes all refresh tokens for a user (logout). */
    @Transactional
    public void revokeAll(String username) {
        Rider rider = riderUtil.findRiderByUsername(username);
        refreshTokenRepository.revokeAllByRider(rider);
        log.debug("All refresh tokens revoked for rider: {}", username);
    }
}