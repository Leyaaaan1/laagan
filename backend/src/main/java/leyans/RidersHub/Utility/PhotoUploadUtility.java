package leyans.RidersHub.Utility;

import leyans.RidersHub.DTO.Response.FinishedDTO.PhotoDTO;
import leyans.RidersHub.Repository.FinishedRidePhotoRepository;
import leyans.RidersHub.Repository.FinishedRideRepository;
import leyans.RidersHub.model.FinishedRide.FinishedRidePhoto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;


@Service
public class PhotoUploadUtility {

    private final FinishedRideRepository finishedRideRepository;
    private final FinishedRidePhotoRepository finishedRidePhotoRepository;

    public PhotoUploadUtility(FinishedRideRepository finishedRideRepository, FinishedRidePhotoRepository finishedRidePhotoRepository) {
        this.finishedRideRepository = finishedRideRepository;
        this.finishedRidePhotoRepository = finishedRidePhotoRepository;
    }

    @Transactional
    public PhotoDTO uploadRidePhoto(
            String generatedRidesId,
            org.springframework.web.multipart.MultipartFile file,
            String caption,
            String uploadedBy) throws java.io.IOException {

        AppLogger.info(this.getClass(), "uploadRidePhoto called",
                "generatedRidesId", generatedRidesId, "uploadedBy", uploadedBy);

        // Validate ride exists and is finished
        finishedRideRepository.findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Finished ride not found: " + generatedRidesId));

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        // Build save path: uploads/ride-photos/{rideId}/{uuid}.{ext}
        String ext = contentType.contains("png") ? "png"
                : contentType.contains("gif") ? "gif" : "jpg";
        String filename = java.util.UUID.randomUUID() + "." + ext;

        java.nio.file.Path dir = java.nio.file.Paths.get("uploads", "ride-photos", generatedRidesId);
        java.nio.file.Files.createDirectories(dir);
        java.nio.file.Files.copy(file.getInputStream(), dir.resolve(filename));

        String imageUrl = "/uploads/ride-photos/" + generatedRidesId + "/" + filename;

        FinishedRidePhoto saved = finishedRidePhotoRepository.save(
                new FinishedRidePhoto(generatedRidesId, imageUrl, caption, uploadedBy));

        AppLogger.info(this.getClass(), "Photo saved", "url", imageUrl);

        return new PhotoDTO(
                saved.getId(), saved.getImageUrl(), saved.getCaption(),
                saved.getUploadedBy(), saved.getUploadedAt().toString());
    }

    // ── ADD: Get photos only ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PhotoDTO> getRidePhotos(String generatedRidesId) {
        return finishedRidePhotoRepository
                .findByGeneratedRidesIdOrderByUploadedAtAsc(generatedRidesId)
                .stream()
                .map(p -> new PhotoDTO(
                        p.getId(), p.getImageUrl(), p.getCaption(),
                        p.getUploadedBy(), p.getUploadedAt().toString()))
                .collect(Collectors.toList());
    }
}
