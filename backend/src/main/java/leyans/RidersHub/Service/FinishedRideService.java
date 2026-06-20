package leyans.RidersHub.Service;

import leyans.RidersHub.DTO.Response.FinishedDTO.FinishedRideResponseDTO;
import leyans.RidersHub.ExceptionHandler.RideAuthorizationException;
import leyans.RidersHub.Repository.*;
import leyans.RidersHub.Utility.AppLogger;
import leyans.RidersHub.Utility.FinishedRideUtility;
import leyans.RidersHub.Utility.StartedUtil;
import leyans.RidersHub.model.*;
import leyans.RidersHub.model.FinishedRide.FinishedRide;
import leyans.RidersHub.model.participant.RideCheckpointArrival;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;


@Service
public class FinishedRideService {

    private final StartedRideRepository startedRideRepository;
    private final RidesRepository ridesRepository;
    private final FinishedRideRepository finishedRideRepository;
    private final StartedUtil startedUtil;
    private final RideCheckpointArrivalRepository rideCheckpointArrivalRepository;
    private final FinishedRideUtility finishedRideUtility;
    private final RideStatusService rideStatusService;
    private final PersonalFinishedRideService personalFinishedRideService;
    private final RideLocationEmitterRegistry rideLocationEmitterRegistry;


    public FinishedRideService(StartedRideRepository startedRideRepository,
                               RidesRepository ridesRepository,
                               FinishedRideRepository finishedRideRepository,
                               StartedUtil startedUtil,
                               RideCheckpointArrivalRepository rideCheckpointArrivalRepository, FinishedRideUtility finishedRideUtility, RideStatusService rideStatusService, PersonalFinishedRideService personalFinishedRideService, RideLocationEmitterRegistry rideLocationEmitterRegistry) {
        this.startedRideRepository = startedRideRepository;
        this.ridesRepository = ridesRepository;
        this.finishedRideRepository = finishedRideRepository;
        this.startedUtil = startedUtil;
        this.rideCheckpointArrivalRepository = rideCheckpointArrivalRepository;
        this.finishedRideUtility = finishedRideUtility;
        this.rideStatusService = rideStatusService;
        this.personalFinishedRideService = personalFinishedRideService;
        this.rideLocationEmitterRegistry = rideLocationEmitterRegistry;
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

        // NEW: if the ride was already force-finished by the creator, block personal finish
        if (finishedRideRepository.existsByRideGeneratedRidesId(generatedRidesId)) {
            throw new IllegalStateException("This ride has already been finished by the creator");
        }

        boolean requesterAtEnding = rideCheckpointArrivalRepository
                .existsByRideGeneratedRidesIdAndRiderUsernameAndCheckpointType(
                        ride.getGeneratedRidesId(),
                        requester.getUsername(),
                        RideCheckpointArrival.CheckpointType.ENDING
                );

        if (!requesterAtEnding) {
            throw new IllegalStateException("You must reach the ending point before finishing the ride");
        }

        // Delegates to service which handles startTime, duration, and repository.save()
        personalFinishedRideService.createPersonalSummaryOnArrival(
                requester, ride, LocalDateTime.now());

        return finishedRideUtility.buildPersonalFinishResponse(generatedRidesId, requester);
    }
    @Transactional
    public FinishedRideResponseDTO forceFinishRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "forceFinishRide called", "generatedRidesId", generatedRidesId);

        Rider requester = startedUtil.authenticateAndGetInitiator();

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found: " + generatedRidesId));

        if (!ride.getUsername().getUsername().equals(requester.getUsername())) {
            throw new RideAuthorizationException("Only the ride creator can force-finish the entire ride");
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

        AppLogger.warn(this.getClass(), "Force-finishing ride for all participants",
                "generatedRidesId", generatedRidesId,
                "creator", requester.getUsername());
        rideStatusService.markFinished(generatedRidesId, "Ride finished by " + requester.getUsername());

        // Ride is over for everyone — close any open SSE streams for it so they
        // don't sit alive (and getting heartbeat-pinged) until their 300s timeout.
        rideLocationEmitterRegistry.closeAll(startedRide.getId());

        return finishedRideUtility.buildAndSaveFinishedRide(startedRide, ride, requester, generatedRidesId);
    }
    @Transactional
    public FinishedRideResponseDTO forceFinishOwnRide(String generatedRidesId) {
        AppLogger.info(this.getClass(), "forceFinishOwnRide called",
                "generatedRidesId", generatedRidesId);

        Rider requester = startedUtil.authenticateAndGetInitiator();

        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found: " + generatedRidesId));

        if (!Boolean.TRUE.equals(ride.getActive())) {
            throw new IllegalStateException("Ride is not currently active");
        }

        if (finishedRideRepository.existsByRideGeneratedRidesId(generatedRidesId)) {
            throw new IllegalStateException("This ride has already been finished");
        }

        StartedRide startedRide = startedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new IllegalStateException("StartedRide record missing"));

        boolean isCreator = ride.getUsername().getUsername().equals(requester.getUsername());
        boolean isParticipant = startedRide.getParticipants().stream()
                .anyMatch(p -> p.getUsername().equals(requester.getUsername()));

        if (!isCreator && !isParticipant) {
            throw new RideAuthorizationException("Only ride participants can force-finish their ride");
        }

        AppLogger.warn(this.getClass(), "Force-finishing own ride only",
                "generatedRidesId", generatedRidesId,
                "rider", requester.getUsername());

        personalFinishedRideService.createPersonalSummaryOnArrival(
                requester, ride, LocalDateTime.now());

        return finishedRideUtility.buildPersonalFinishResponse(generatedRidesId, requester);
    }


}