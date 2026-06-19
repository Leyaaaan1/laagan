package leyans.RidersHub.Service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import leyans.RidersHub.DTO.Response.FinishedDTO.SnapshotResponseDTO;
import leyans.RidersHub.Repository.FinishedRideRepository;
import leyans.RidersHub.Repository.PersonalFinishedRideRepository;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.StartedUtil;
import leyans.RidersHub.model.FinishedRide.FinishedRide;
import leyans.RidersHub.model.FinishedRide.PersonalFinishedRide;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
public class UploadService {

    private final Cloudinary cloudinary;
    private final StartedUtil startedUtil;
    private final RidesRepository ridesRepository;
    private final FinishedRideRepository finishedRideRepository;
    private final PersonalFinishedRideRepository personalFinishedRideRepository;

    public UploadService(Cloudinary cloudinary,
                         StartedUtil startedUtil,
                         RidesRepository ridesRepository,
                         FinishedRideRepository finishedRideRepository,
                         PersonalFinishedRideRepository personalFinishedRideRepository) {
        this.cloudinary = cloudinary;
        this.startedUtil = startedUtil;
        this.ridesRepository = ridesRepository;
        this.finishedRideRepository = finishedRideRepository;
        this.personalFinishedRideRepository = personalFinishedRideRepository;
    }

    // ── Raw Cloudinary upload ─────────────────────────────────────────────────

    public String uploadSnapshot(byte[] imageBytes) {
        try {
            Map uploadResult = cloudinary.uploader().upload(imageBytes, ObjectUtils.asMap(
                    "resource_type", "image",
                    "folder", "ride_snapshots"
            ));
            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            AppLogger.error(this.getClass(), "Cloudinary upload failed", "error", e.getMessage());
            throw new RuntimeException("Cloudinary upload failed: " + e.getMessage(), e);
        }
    }

    // ── Upload snapshot for a ride ────────────────────────────────────────────
    //
    // One endpoint handles both cases:
    //   - If the ride has a FinishedRide record  → save URL there (group ride)
    //   - If the rider has a PersonalFinishedRide → save URL there (solo ride)
    // The frontend doesn't need to know which entity is backing the storage.

    @Transactional
    public SnapshotResponseDTO uploadSnapshot(String generatedRidesId, MultipartFile file) {
        AppLogger.info(this.getClass(), "uploadSnapshot called", "generatedRidesId", generatedRidesId);

        Rider requester = startedUtil.authenticateAndGetInitiator();

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found: " + generatedRidesId));

        // Authorization: must be owner or participant
        boolean isOwner = ride.getUsername().getUsername().equals(requester.getUsername());
        boolean isParticipant = ride.getParticipants().stream()
                .anyMatch(p -> p.getUsername().equals(requester.getUsername()));

        if (!isOwner && !isParticipant) {
            throw new SecurityException("Only the ride owner or participants can upload snapshots");
        }

        try {
            String imageUrl = uploadSnapshot(file.getBytes());

            // Try group ride first, then fall back to personal
            java.util.Optional<FinishedRide> groupOpt =
                    finishedRideRepository.findByRideGeneratedRidesId(generatedRidesId);

            if (groupOpt.isPresent()) {
                FinishedRide finishedRide = groupOpt.get();
                finishedRide.setSnapshotUrl(imageUrl);
                finishedRideRepository.save(finishedRide);
            } else {
                PersonalFinishedRide personal = personalFinishedRideRepository
                        .findByRideGeneratedRidesIdAndRiderUsername(generatedRidesId, requester.getUsername())
                        .orElseThrow(() -> new IllegalStateException(
                                "Snapshots can only be uploaded for finished rides"));
                personal.setSnapshotUrl(imageUrl);
                personalFinishedRideRepository.save(personal);
            }

            AppLogger.info(this.getClass(), "Snapshot saved", "generatedRidesId", generatedRidesId);
            return new SnapshotResponseDTO(imageUrl);

        } catch (SecurityException | IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process snapshot: " + e.getMessage(), e);
        }
    }

    // ── Get snapshot URL for a ride ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public SnapshotResponseDTO getSnapshot(String generatedRidesId) {
        AppLogger.info(this.getClass(), "getSnapshot called", "generatedRidesId", generatedRidesId);

        Rider requester = startedUtil.authenticateAndGetInitiator();

        // Check group ride first
        java.util.Optional<FinishedRide> groupOpt =
                finishedRideRepository.findByRideGeneratedRidesId(generatedRidesId);

        if (groupOpt.isPresent() && groupOpt.get().getSnapshotUrl() != null) {
            return new SnapshotResponseDTO(groupOpt.get().getSnapshotUrl());
        }

        // Fall back to personal
        String url = personalFinishedRideRepository
                .findByRideGeneratedRidesIdAndRiderUsername(generatedRidesId, requester.getUsername())
                .map(PersonalFinishedRide::getSnapshotUrl)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No snapshot found for ride: " + generatedRidesId));

        if (url == null) {
            throw new IllegalArgumentException("No snapshot found for ride: " + generatedRidesId);
        }

        return new SnapshotResponseDTO(url);
    }
}