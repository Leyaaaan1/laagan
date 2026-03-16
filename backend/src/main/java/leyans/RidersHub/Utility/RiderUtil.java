package leyans.RidersHub.Utility;

import jakarta.persistence.EntityNotFoundException;
import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Repository.StartedRideRepository;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.StartedRide;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RiderUtil {

    private final RidesRepository ridesRepository;

    private final StartedRideRepository startedRideRepository;


    private final RiderRepository riderRepository;
    public RiderUtil(RidesRepository ridesRepository, StartedRideRepository startedRideRepository, RiderRepository riderRepository) {
        this.ridesRepository = ridesRepository;
        this.startedRideRepository = startedRideRepository;
        this.riderRepository = riderRepository;
    }

    public Rides findRideById(Integer generatedRidesId) {
        return ridesRepository.findByGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Ride not found with ID: " + generatedRidesId));
    }


    public Rider findRiderByUsername(String username) {
        Rider rider = riderRepository.findByUsername(username);
        if (rider == null) {
            throw new EntityNotFoundException("Rider not found with username: " + username);
        }
        return rider;
    }


    public StartedRide findStartedRideByRideId(Integer generatedRidesId) {
        return startedRideRepository.findByRideGeneratedRidesId(generatedRidesId)
                .orElseThrow(() -> new EntityNotFoundException("Started ride not found with ride ID: " + generatedRidesId));
    }

    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("Getting current username - Auth: " + authentication);

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }

        return authentication.getName();
    }


    public List<StartedRide> findStartedRidesByRider(Rider rider) {
        return startedRideRepository.findAll().stream()
                .filter(sr -> sr.getUsername().equals(rider) ||
                        sr.getRide().getParticipants().contains(rider))
                .toList();
    }

}
