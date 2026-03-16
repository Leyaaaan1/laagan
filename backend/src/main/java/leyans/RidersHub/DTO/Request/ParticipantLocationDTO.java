package leyans.RidersHub.DTO.Request;

import java.time.LocalDateTime;

public class ParticipantLocationDTO {
    private String username;
    private double latitude;
    private double longitude;
    private LocalDateTime lastUpdate;


    public ParticipantLocationDTO(String username, double latitude, double longitude, LocalDateTime lastUpdate) {
        this.username = username;
        this.latitude = latitude;
        this.longitude = longitude;
        this.lastUpdate = lastUpdate;
    }



    public void setUsername(String username) {
        this.username = username;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public LocalDateTime getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(LocalDateTime lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    public String getUsername() {
        return username;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }
}