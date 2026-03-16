package leyans.RidersHub.Repository;

import leyans.RidersHub.model.RiderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiderTypeRepository extends JpaRepository<RiderType, Integer> {

    RiderType findByRiderType(String riderType);


}
