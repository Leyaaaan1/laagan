package leyans.RidersHub.DTO.Response.FinishedDTO;


import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Flat, share-page-ready view of a finished ride for ONE rider.
 *
 * Ride-level facts (name, route, distance, photo) are always populated once
 * the ride is finished. Personal-performance fields (start/end time,
 * duration, speed, segments) are only populated when the requesting rider
 * has their own PersonalFinishedRide record for this ride — check
 * hasPersonalRecord before reading them.
 */
public class DetailDTO {

    private String generatedRidesId;
    private String rideName;
    private String routeCoordinates;
    private String startingPointName;
    private String endingPointName;
    private List<StopPointDTO> stopPoints;
    private Integer distanceMeters;

    private boolean hasPersonalRecord;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private Double averageSpeedKph;
    private List<SpeedSegmentDTO> speedSegments;

    private PhotoDTO photo;

    public DetailDTO() {}

    public String getGeneratedRidesId() { return generatedRidesId; }
    public void setGeneratedRidesId(String generatedRidesId) { this.generatedRidesId = generatedRidesId; }

    public String getRideName() { return rideName; }
    public void setRideName(String rideName) { this.rideName = rideName; }

    public String getRouteCoordinates() { return routeCoordinates; }
    public void setRouteCoordinates(String routeCoordinates) { this.routeCoordinates = routeCoordinates; }

    public String getStartingPointName() { return startingPointName; }
    public void setStartingPointName(String startingPointName) { this.startingPointName = startingPointName; }

    public String getEndingPointName() { return endingPointName; }
    public void setEndingPointName(String endingPointName) { this.endingPointName = endingPointName; }

    public List<StopPointDTO> getStopPoints() { return stopPoints; }
    public void setStopPoints(List<StopPointDTO> stopPoints) { this.stopPoints = stopPoints; }

    public Integer getDistanceMeters() { return distanceMeters; }
    public void setDistanceMeters(Integer distanceMeters) { this.distanceMeters = distanceMeters; }

    public boolean isHasPersonalRecord() { return hasPersonalRecord; }
    public void setHasPersonalRecord(boolean hasPersonalRecord) { this.hasPersonalRecord = hasPersonalRecord; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Double getAverageSpeedKph() { return averageSpeedKph; }
    public void setAverageSpeedKph(Double averageSpeedKph) { this.averageSpeedKph = averageSpeedKph; }

    public List<SpeedSegmentDTO> getSpeedSegments() { return speedSegments; }
    public void setSpeedSegments(List<SpeedSegmentDTO> speedSegments) { this.speedSegments = speedSegments; }

    public PhotoDTO getPhoto() { return photo; }
    public void setPhoto(PhotoDTO photo) { this.photo = photo; }
}