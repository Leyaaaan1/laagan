package leyans.RidersHub.Service;

import leyans.RidersHub.Config.JWT.JwtUtil;
import leyans.RidersHub.Repository.Auth.RefreshTokenRepository;
import leyans.RidersHub.Repository.RiderProfileRepository;
import leyans.RidersHub.Service.Auth.TokenBlacklistService;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.model.RiderProfile;
import leyans.RidersHub.model.RiderType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.util.Optional;

@Service
public class UserDetailsManager implements org.springframework.security.core.userdetails.UserDetailsService {

    private final RiderRepository riderRepository;
    private final RiderUtil riderUtil;
    private final JwtUtil jwtUtil;

    private final TokenBlacklistService tokenBlacklistService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RiderProfileRepository riderProfileRepository;


    @Autowired
    public UserDetailsManager(RiderRepository riderRepository, RiderUtil riderUtil, JwtUtil jwtUtil, TokenBlacklistService tokenBlacklistService, RefreshTokenRepository refreshTokenRepository, RiderProfileRepository riderProfileRepository) {
        this.riderRepository = riderRepository;
        this.riderUtil = riderUtil;
        this.jwtUtil = jwtUtil;
        this.tokenBlacklistService = tokenBlacklistService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.riderProfileRepository = riderProfileRepository;
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {

        Rider rider = riderRepository.findByUsername(identifier)
                .or(() -> riderRepository.findByAuthEmail(identifier))
                .orElseThrow(() -> new UsernameNotFoundException("Rider not found: " + identifier));

        // Social login riders (Google, Facebook) have no password.
        // Spring Security requires a non-null value — use empty string.
        // Authentication for these riders goes through token verification,
        // not password comparison, so this value is never actually checked.
        String password = rider.getPassword() != null ? rider.getPassword() : "";

        return User.builder()
                .username(rider.getUsername())
                .password(password)             // ← never null
                .authorities("ROLE_RIDER")
                .disabled(!rider.getEnabled())
                .build();
    }



    @Transactional
    public void deleteAccount(String username, String rawAccessToken) {

        Rider rider = riderUtil.findRiderByUsername(username);

        try {
            String jti = jwtUtil.getJtiFromToken(rawAccessToken);
            if (jti != null) {
                long remainingMs = jwtUtil.getTokenExpirationMs(rawAccessToken);
                tokenBlacklistService.blacklistToken(jti, Math.max(remainingMs, 1000));
            }
        } catch (Exception e) {

        }

        int revokedCount = refreshTokenRepository.deleteAllByRider(rider);

        riderProfileRepository.findByRider(rider).ifPresent(riderProfileRepository::delete);

        riderRepository.delete(rider);

    }
}