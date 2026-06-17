package leyans.RidersHub.Repository;


import leyans.RidersHub.model.FinishedRide.FinishedRidePhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FinishedRidePhotoRepository extends JpaRepository<FinishedRidePhoto, Long> {
    List<FinishedRidePhoto> findByGeneratedRidesIdOrderByUploadedAtAsc(String generatedRidesId);
    void deleteByGeneratedRidesId(String generatedRidesId);
}