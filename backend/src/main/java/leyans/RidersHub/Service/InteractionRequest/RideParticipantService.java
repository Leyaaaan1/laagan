package leyans.RidersHub.Service.InteractionRequest;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import leyans.RidersHub.Repository.RidesRepository;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class RideParticipantService {

    private final RidesRepository ridesRepository;
    @Autowired
    private final RiderUtil riderUtil;




    @Autowired
    public RideParticipantService(RidesRepository ridesRepository, RiderUtil riderUtil) {
        this.ridesRepository = ridesRepository;

        this.riderUtil = riderUtil;
    }

    //add in creation of ride
    public List<Rider> addRiderParticipants(List<String> usernames) {
        if (usernames == null) return List.of();
        return usernames.stream()
                .map(username -> {
                    try {
                        return riderUtil.findRiderByUsername(username);
                    } catch (EntityNotFoundException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
    @Transactional
    public void addParticipantToRide(Integer generatedRidesId, String username) {
        Rides ride = riderUtil.findRideById(generatedRidesId);
        Rider rider = riderUtil.findRiderByUsername(username);

        // Check if already a participant
        boolean alreadyParticipant = ride.getParticipants().stream()
                .anyMatch(p -> p.getUsername().equals(rider.getUsername()));

        if (!alreadyParticipant) {
            ride.addParticipant(rider);  // Use the entity method
            ridesRepository.save(ride);   // Let Hibernate handle the join table
        }
    }
    @Transactional
    public void removeParticipantFromRide(Integer generatedRidesId, String username) {
        Rides ride = riderUtil.findRideById(generatedRidesId);
        Rider rider = riderUtil.findRiderByUsername(username);

        if (ride.getParticipants() != null &&
                ride.getParticipants().stream()
                        .anyMatch(p -> p.getId().equals(rider.getId()))) {
            ride.getParticipants().remove(rider);
            ridesRepository.save(ride);
        }
    }



//    public List<Rider> getRideParticipants(Integer generatedRidesId) {
//        Rides ride = ridesRepository.findByGeneratedRidesId(generatedRidesId)
//                .orElseThrow(() -> new EntityNotFoundException("Ride not found with ID: " + generatedRidesId));
//        return ride.getParticipants();
//    }


}
