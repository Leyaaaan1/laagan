package leyans.RidersHub.Repository.Auth;


import leyans.RidersHub.model.auth.GoogleAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GoogleAccountRepository extends JpaRepository<GoogleAccount, Integer> {
    Optional<GoogleAccount> findByGoogleId(String googleId);
    Optional<GoogleAccount> findByRiderId(Integer riderId);
}