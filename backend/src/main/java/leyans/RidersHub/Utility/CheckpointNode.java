package leyans.RidersHub.Utility;

import leyans.RidersHub.model.participant.RideCheckpointArrival;

public class CheckpointNode {
    public final RideCheckpointArrival.CheckpointType type;
    public final Integer stopIndex;  // null for STARTING and ENDING
    final double lat;
    final double lng;
    final String label;

    public CheckpointNode(RideCheckpointArrival.CheckpointType type,
                          Integer stopIndex,
                          double lat, double lng,
                          String label) {
        this.type = type;
        this.stopIndex = stopIndex;
        this.lat = lat;
        this.lng = lng;
        this.label = label;
    }

    public RideCheckpointArrival.CheckpointType getType() {
        return type;
    }

    public Integer getStopIndex() {
        return stopIndex;
    }

    public double getLat() {
        return lat;
    }

    public double getLng() {
        return lng;
    }

    public String getLabel() {
        return label;
    }
}