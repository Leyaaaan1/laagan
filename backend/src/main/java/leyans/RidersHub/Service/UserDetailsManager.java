package leyans.RidersHub.Service;

import leyans.RidersHub.model.Rider;
import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.model.RiderType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsManager implements org.springframework.security.core.userdetails.UserDetailsService {

    private final RiderRepository riderRepository;

    @Autowired
    public UserDetailsManager(RiderRepository riderRepository) {
        this.riderRepository = riderRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Rider rider = riderRepository.findByUsername(username);


        RiderType riderType = rider.getRiderType();

        String role = "ROLE_" + riderType.getRiderType().toUpperCase();

        return User.builder()
                .username(rider.getUsername())
                .password(rider.getPassword())
                .authorities(role)
                .disabled(!rider.getEnabled())
                .build();
    }
}