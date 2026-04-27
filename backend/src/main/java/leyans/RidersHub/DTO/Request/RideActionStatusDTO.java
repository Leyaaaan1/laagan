package leyans.RidersHub.DTO.Request;

public class RideActionStatusDTO {
    public final boolean isOwner;
    public final boolean hasJoined;
    public final boolean hasPendingRequest;
    public final boolean rideStarted;
    public final boolean isActive;

    public RideActionStatusDTO(boolean isOwner, boolean hasJoined, boolean hasPendingRequest,
                               boolean rideStarted, boolean isActive) {
        this.isOwner = isOwner;
        this.hasJoined = hasJoined;
        this.hasPendingRequest = hasPendingRequest;
        this.rideStarted = rideStarted;
        this.isActive = isActive;
    }


}