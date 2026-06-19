package leyans.RidersHub.Repository;


import leyans.RidersHub.model.FinishedRide.FinishedRidePhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinishedRidePhotoRepository extends JpaRepository<FinishedRidePhoto, Long> {
    Optional<FinishedRidePhoto> findFirstByGeneratedRidesIdAndCaptionOrderByUploadedAtDesc(
            String generatedRidesId,
            String caption
    );
}