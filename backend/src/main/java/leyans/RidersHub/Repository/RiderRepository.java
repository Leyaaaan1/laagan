package leyans.RidersHub.Repository;

import leyans.RidersHub.DTO.Request.RiderDTO.RiderDTO;
import leyans.RidersHub.model.Rider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiderRepository extends JpaRepository<Rider, Integer> {

    Rider findByUsername(String username);



}



