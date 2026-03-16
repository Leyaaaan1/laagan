package leyans.RidersHub.Repository.Auth;

import leyans.RidersHub.model.auth.FacebookAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacebookAccountRepository  extends JpaRepository<FacebookAccount, Integer> {
    FacebookAccount findByUsername(String username);

    FacebookAccount findByRiderId(Integer riderId);
}
