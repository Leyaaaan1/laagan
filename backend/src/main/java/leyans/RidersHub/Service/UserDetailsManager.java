package leyans.RidersHub.Service;

import leyans.RidersHub.model.Rider;
import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.model.RiderType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

@Service
public class UserDetailsManager implements org.springframework.security.core.userdetails.UserDetailsService {

    private final RiderRepository riderRepository;

    @Autowired
    public UserDetailsManager(RiderRepository riderRepository) {
        this.riderRepository = riderRepository;
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
}