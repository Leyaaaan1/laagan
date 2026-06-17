package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Response.FinishedDTO.FinishedRideResponseDTO;
import leyans.RidersHub.DTO.Response.FinishedDTO.PhotoDTO;
import leyans.RidersHub.ExceptionHandler.RideAuthorizationException;
import leyans.RidersHub.Repository.*;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.FinishedRideUtility;
import leyans.RidersHub.Utility.RideCalculationUtils;
import leyans.RidersHub.Utility.StartedUtil;
import leyans.RidersHub.model.*;
import leyans.RidersHub.model.FinishedRide.FinishedRide;
import leyans.RidersHub.model.FinishedRide.FinishedRidePhoto;
import leyans.RidersHub.model.participant.RideCheckpointArrival;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;


@Service
public class FinishedRideService {

    private final StartedRideRepository startedRideRepository;
    private final RidesRepository ridesRepository;
    private final FinishedRideRepository finishedRideRepository;
    private final StartedUtil startedUtil;
    private final RideCheckpointArrivalRepository rideCheckpointArrivalRepository;
    private final FinishedRideUtility finishedRideUtility;
    private final RideStatusService rideStatusService;
    private final FinishedRidePhotoRepository finishedRidePhotoRepository;

    public FinishedRideService(StartedRideRepository startedRideRepository,
                               RidesRepository ridesRepository,
                               FinishedRideRepository finishedRideRepository,
                               StartedUtil startedUtil,
                               RideCheckpointArrivalRepository rideCheckpointArrivalRepository, FinishedRideUtility finishedRideUtility, RideStatusService rideStatusService, FinishedRidePhotoRepository finishedRidePhotoRepository) {
        this.startedRideRepository = startedRideRepository;
        this.ridesRepository = ridesRepository;
        this.finishedRideRepository = finishedRideRepository;
        this.startedUtil = startedUtil;
        this.rideCheckpointArrivalRepository = rideCheckpointArrivalRepository;
        this.finishedRideUtility = finishedRideUtility;
        this.rideStatusService = rideStatusService;
        this.finishedRidePhotoRepository = finishedRidePhotoRepository;
    }

    @Transactional
    public FinishedRideResponseDTO finishRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "finishRide called", "generatedRidesId", generatedRidesId);

        Rider requester = startedUtil.authenticateAndGetInitiator();

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found: " + generatedRidesId));

        if (!Boolean.TRUE.equals(ride.getActive())) {
            throw new IllegalStateException("Ride is not currently active");
        }

        if (finishedRideRepository.existsByRideGeneratedRidesId(generatedRidesId)) {
            throw new IllegalStateException("Ride has already been finished");
        }

        StartedRide startedRide = startedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalStateException("StartedRide record missing"));

        // Check if requester is at ending point
        boolean requesterAtEnding = rideCheckpointArrivalRepository
                .existsByRideGeneratedRidesIdAndRiderUsernameAndCheckpointType(
                        ride.getGeneratedRidesId(),
                        requester.getUsername(),
                        RideCheckpointArrival.CheckpointType.ENDING
                );

        if (!requesterAtEnding) {
            throw new IllegalStateException("You must reach the ending point before finishing the ride");
        }

        // Check if ALL participants have reached the ending point
        int totalParticipants = startedRide.getParticipants().size();
        long participantsAtEnding = rideCheckpointArrivalRepository
                .countByRideGeneratedRidesIdAndCheckpointType(
                        generatedRidesId,
                        RideCheckpointArrival.CheckpointType.ENDING);

        if (participantsAtEnding < totalParticipants) {
            int stillWaiting = (int) (totalParticipants - participantsAtEnding);
            throw new IllegalStateException(
                    "Waiting for " + stillWaiting + " participant(s) to reach the finish line");
        }
        rideStatusService.markFinished(generatedRidesId, "Ride finished by " + requester.getUsername());

        return finishedRideUtility.buildAndSaveFinishedRide(startedRide, ride, requester, generatedRidesId);
    }

    @Transactional
    public FinishedRideResponseDTO forceFinishRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "forceFinishRide called", "generatedRidesId", generatedRidesId);

        Rider requester = startedUtil.authenticateAndGetInitiator();

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found: " + generatedRidesId));

        // Only the ride creator can force-finish
        if (!ride.getUsername().getUsername().equals(requester.getUsername())) {
            throw new RideAuthorizationException("Only the ride creator can force-finish a ride");
        }

        if (!Boolean.TRUE.equals(ride.getActive())) {
            throw new IllegalStateException("Ride is not currently active");
        }

        if (finishedRideRepository.existsByRideGeneratedRidesId(generatedRidesId)) {
            throw new IllegalStateException("Ride has already been finished");
        }

        StartedRide startedRide = startedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalStateException("StartedRide record missing"));

        AppLogger.warn(this.getClass(), "Force-finishing ride by creator",
                "generatedRidesId", generatedRidesId,
                "creator", requester.getUsername());
        rideStatusService.markFinished(generatedRidesId, "Ride finished by " + requester.getUsername());

        return finishedRideUtility.buildAndSaveFinishedRide(startedRide, ride, requester, generatedRidesId);
    }


    @Transactional(readOnly = true)
    public FinishedRideResponseDTO getFinishedRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "getFinishedRide called", "generatedRidesId", generatedRidesId);

        FinishedRide finishedRide = finishedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Finished ride not found: " + generatedRidesId));

        FinishedRideResponseDTO dto = new FinishedRideResponseDTO(finishedRide);

        // Route coordinates live on the Rides entity
        dto.setRouteCoordinates(finishedRide.getRide().getRouteCoordinates());

        // REFACTOR: was computeSpeed(distance, duration) private method.
        // Now delegates to RideCalculationUtils — single source of truth.
        dto.setAverageSpeedKph(RideCalculationUtils.computeAverageSpeedKph(
                finishedRide.getRide().getDistance(),
                finishedRide.getDurationMinutes()));

        List<FinishedRidePhoto> photos =
                finishedRidePhotoRepository.findByGeneratedRidesIdOrderByUploadedAtAsc(generatedRidesId);

        photos.stream()
                .findFirst()
                .ifPresent(p -> dto.setPhotos(new PhotoDTO(
                        p.getId(),
                        p.getImageUrl(),
                        p.getCaption(),
                        p.getUploadedBy(),
                        p.getUploadedAt().toString()
                )));
        return dto;
    }

}