package leyans.RidersHub.Service;


import jakarta.transaction.Transactional;
import leyans.RidersHub.DTO.Request.RiderDTO.RiderDTO;
import leyans.RidersHub.DTO.Response.RiderResponseDTO;
import leyans.RidersHub.Repository.RiderTypeRepository;
import leyans.RidersHub.Service.Auth.AccountLockoutService;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.RiderType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import leyans.RidersHub.Repository.RiderRepository;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RiderService {

    private final RiderRepository riderRepository;
    private final RiderTypeRepository riderTypeRepository;
    private final PasswordEncoder passwordEncoder;




    public RiderService(RiderRepository riderRepository,
                        RiderTypeRepository riderTypeRepository,
                        PasswordEncoder passwordEncoder) {
        this.riderRepository = riderRepository;
        this.riderTypeRepository = riderTypeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public RiderType addRiderType(String riderTypeName) {
        RiderType riderType = new RiderType();
        riderType.setRiderType(riderTypeName);
        return riderTypeRepository.save(riderType);
    }

    public RiderType getCurrentUserRiderType(String username) {
        Rider rider = riderRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return rider.getRiderType();
    }



    @Transactional
    public String registerRiderWithValidation(String username, String password,
                                              String riderType, String clientIp,
                                              AccountLockoutService lockoutService) {
        // Check registration rate limit first
        int attempts = lockoutService.getRegisterAttempts(clientIp);
        if (attempts >= 3) {
            throw new RuntimeException("Registration limit exceeded for this IP");
        }

        // Existing registration logic
        return registerRider(username, password, riderType);
    }



    public String registerRider(String username, String password, String riderType) {
        // ✅ Check if Optional is present using isPresent()
        if (riderRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        String encodedPassword = passwordEncoder.encode(password);
        RiderType riderTypeName = null;
        if (riderType != null && !riderType.isEmpty()) {
            riderTypeName = getRiderTypeByName(riderType);
        }
        Rider newRider = new Rider();
        newRider.setUsername(username);
        newRider.setPassword(encodedPassword);
        newRider.setEnabled(true);
        newRider.setRiderType(riderTypeName);

        riderRepository.save(newRider);
        return username;
    }



    public Rider getRiderByUsername(String username) {
        AppLogger.info(this.getClass(), "getRiderByUsername called", "username", username);

        // ✅ Use orElseThrow to handle Optional
        Rider rider = riderRepository.findByUsername(username)
                .orElseThrow(() -> {
                    AppLogger.throwResourceNotFound(this.getClass(),
                            "Rider not found: " + username);
                    return new RuntimeException("Rider not found: " + username);
                });

        AppLogger.info(this.getClass(), "Rider retrieved successfully", "username", username);
        return rider;
    }

    public RiderType getRiderTypeByName(String typeName) {
        RiderType type = riderTypeRepository.findByRiderType(typeName);
        if (type == null) {
            throw new IllegalArgumentException("RiderType not found: " + typeName);
        }
        return type;
    }


}



