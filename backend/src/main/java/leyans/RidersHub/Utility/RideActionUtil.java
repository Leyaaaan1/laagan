package leyans.RidersHub.Utility;

import leyans.RidersHub.DTO.Request.RideActionStatusDTO;
import leyans.RidersHub.Repository.RideJoinRequestRepository;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Repository.StartedRideRepository;
import leyans.RidersHub.model.Rides;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class RideActionUtil {

    private final RidesRepository ridesRepository;
    private final RideJoinRequestRepository rideJoinRequestRepository;
    private final StartedRideRepository startedRideRepository;
    private final RiderUtil riderUtil;

    public RideActionUtil(
            RidesRepository ridesRepository,
            RideJoinRequestRepository rideJoinRequestRepository,
            StartedRideRepository startedRideRepository,
            RiderUtil riderUtil) {
        this.ridesRepository = ridesRepository;
        this.rideJoinRequestRepository = rideJoinRequestRepository;
        this.startedRideRepository = startedRideRepository;
        this.riderUtil = riderUtil;
    }

    /**
     * Get status for currently authenticated user.
     * Uses the security context username — no username needs to be passed from the frontend.
     */
    @Transactional(readOnly = true)
    public RideActionStatusDTO getRideActionStatusForCurrentUser(String generatedRidesId) {
        String currentUsername = null;
        try {
            currentUsername = riderUtil.getCurrentUsername();
        } catch (Exception e) {
            // Not authenticated — return all-false default
            return new RideActionStatusDTO(false, false, false, false, false);
        }

        if (currentUsername == null || currentUsername.isBlank()) {
            return new RideActionStatusDTO(false, false, false, false, false);
        }

        return getRideActionStatus(generatedRidesId, currentUsername);
    }

    /**
     * Check if a specific user has already joined the ride as a participant.
     */
    @Transactional(readOnly = true)
    public boolean hasUserJoinedRide(String generatedRidesId, String username) {
        Optional<Rides> ride = ridesRepository.findByGeneratedRidesId(generatedRidesId);
        if (ride.isEmpty()) return false;

        return ride.get().getParticipants().stream()
                .anyMatch(participant ->
                        participant.getUsername() != null &&
                                participant.getUsername().equalsIgnoreCase(username));
    }

    /**
     * Check if a user has a pending join request (submitted but not yet approved/rejected).
     */
    @Transactional(readOnly = true)
    public boolean hasPendingJoinRequest(String generatedRidesId, String username) {
        return rideJoinRequestRepository
                .findByGeneratedRidesId_GeneratedRidesIdAndRider_Username(generatedRidesId, username)
                .isPresent();
    }

    /**
     * Check if the ride has been started (a StartedRide record exists).
     */
    @Transactional(readOnly = true)
    public boolean hasRideStarted(String generatedRidesId) {
        return startedRideRepository.findByRideGeneratedRidesId(generatedRidesId).isPresent();
    }

    /**
     * Check if a specific user is the ride owner.
     */
    @Transactional(readOnly = true)
    public boolean isRideOwner(String generatedRidesId, String username) {
        Optional<Rides> ride = ridesRepository.findByGeneratedRidesId(generatedRidesId);
        if (ride.isEmpty()) return false;

        String ownerUsername = ride.get().getUsername() != null
                ? ride.get().getUsername().getUsername()
                : null;

        return ownerUsername != null && ownerUsername.equalsIgnoreCase(username);
    }

    /**
     * Get comprehensive ride action status for a specific username.
     *
     * Priority order (mutually exclusive):
     *   1. isOwner  → show Start/Started button, never Join
     *   2. hasJoined → already a participant, show Joined (disabled)
     *   3. hasPendingRequest → sent a join request, show Pending (disabled)
     *   4. none of the above → show Join button
     */
    @Transactional(readOnly = true)
    public RideActionStatusDTO getRideActionStatus(String generatedRidesId, String username) {
        Optional<Rides> rideOpt = ridesRepository.findByGeneratedRidesId(generatedRidesId);

        if (rideOpt.isEmpty()) {
            return new RideActionStatusDTO(false, false, false, false, false);
        }

        Rides ride = rideOpt.get();

        String rideOwnerUsername = ride.getUsername() != null
                ? ride.getUsername().getUsername()
                : null;

        // 1. Owner check (case-insensitive)
        boolean isOwner = rideOwnerUsername != null
                && rideOwnerUsername.equalsIgnoreCase(username);

        // 2. Joined check — owner is NEVER counted as a participant
        boolean hasJoined = !isOwner && ride.getParticipants().stream()
                .anyMatch(p -> p.getUsername() != null
                        && p.getUsername().equalsIgnoreCase(username));

        // 3. Pending request check — only for non-owners who haven't joined yet
        boolean hasPending = !isOwner && !hasJoined && rideJoinRequestRepository
                .findByGeneratedRidesId_GeneratedRidesIdAndRider_Username(generatedRidesId, username)
                .isPresent();

        // 4. Ride started (independent of user role)
        boolean rideStarted = startedRideRepository
                .findByRideGeneratedRidesId(generatedRidesId)
                .isPresent();

        // isActive reflects the DB flag (set separately when ride is activated)
        boolean isActive = ride.getActive() != null && ride.getActive();

        return new RideActionStatusDTO(isOwner, hasJoined, hasPending, rideStarted, isActive);
    }
}