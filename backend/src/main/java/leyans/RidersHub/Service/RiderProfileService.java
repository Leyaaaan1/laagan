package leyans.RidersHub.Service;

import jakarta.transaction.Transactional;
import leyans.RidersHub.DTO.Request.RiderProfileRequestDTO;
import leyans.RidersHub.DTO.Response.RiderProfileResponseDTO;
import leyans.RidersHub.Repository.RiderProfileRepository;
import leyans.RidersHub.Repository.RiderTypeRepository;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.RiderProfile;
import leyans.RidersHub.model.RiderType;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RiderProfileService {

    private final RiderProfileRepository riderProfileRepository;
    private final RiderTypeRepository riderTypeRepository;
    private final RiderService riderService;

    public RiderProfileService(RiderProfileRepository riderProfileRepository,
                               RiderTypeRepository riderTypeRepository,
                               RiderService riderService) {
        this.riderProfileRepository = riderProfileRepository;
        this.riderTypeRepository    = riderTypeRepository;
        this.riderService           = riderService;
    }

    public RiderProfileResponseDTO getProfile(String username) {
        RiderProfile profile = fetchProfileOrThrow(username);
        return new RiderProfileResponseDTO(profile);
    }


    public RiderProfileResponseDTO getOrCreateProfile(String username) {
        return riderProfileRepository
                .findByRiderUsernameWithTypes(username)
                .map(RiderProfileResponseDTO::new)
                .orElseGet(() -> {
                    // getRiderByUsername uses the existing RiderRepository —
                    // rider.riderType is eagerly needed here so it's fetched once
                    Rider rider = riderService.getRiderByUsername(username);

                    RiderProfile blank = new RiderProfile();
                    blank.setRider(rider);

                    RiderType registrationRiderType = rider.getRiderType();
                    if (registrationRiderType != null) {
                        List<RiderType> seeded = new ArrayList<>();
                        seeded.add(registrationRiderType);
                        blank.setRiderTypes(seeded);
                    }

                    return new RiderProfileResponseDTO(riderProfileRepository.save(blank));
                });
    }

    public RiderProfileResponseDTO updateProfile(String username, RiderProfileRequestDTO request) {
        RiderProfile profile = fetchProfileOrThrow(username);
        applyRequestToProfile(profile, request);
        return new RiderProfileResponseDTO(riderProfileRepository.save(profile));
    }

    public RiderProfileResponseDTO addRiderType(String username, String riderTypeName) {
        RiderProfile profile  = fetchProfileOrThrow(username);
        RiderType    riderType = fetchRiderTypeOrThrow(riderTypeName);
        profile.addRiderType(riderType);
        return new RiderProfileResponseDTO(riderProfileRepository.save(profile));
    }

    public RiderProfileResponseDTO removeRiderType(String username, String riderTypeName) {
        RiderProfile profile  = fetchProfileOrThrow(username);
        RiderType    riderType = fetchRiderTypeOrThrow(riderTypeName);
        profile.removeRiderType(riderType);
        return new RiderProfileResponseDTO(riderProfileRepository.save(profile));
    }

    private void applyRequestToProfile(RiderProfile profile, RiderProfileRequestDTO request) {
        if (request.getDisplayName()       != null) profile.setDisplayName(request.getDisplayName());
        if (request.getBio()               != null) profile.setBio(request.getBio());
        if (request.getProfilePictureUrl() != null) profile.setProfilePictureUrl(request.getProfilePictureUrl());

        if (request.getRiderTypeNames() != null && !request.getRiderTypeNames().isEmpty()) {
            List<RiderType> types = request.getRiderTypeNames().stream()
                    .map(this::fetchRiderTypeOrThrow)
                    .collect(Collectors.toList());
            profile.setRiderTypes(types);
        }
    }

    private RiderProfile fetchProfileOrThrow(String username) {
        return riderProfileRepository
                .findByRiderUsernameWithTypes(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Profile not found for user: " + username));
    }

    private RiderType fetchRiderTypeOrThrow(String typeName) {
        RiderType type = riderTypeRepository.findByRiderType(typeName);
        if (type == null) {
            throw new IllegalArgumentException("RiderType not found: " + typeName);
        }
        return type;
    }
}