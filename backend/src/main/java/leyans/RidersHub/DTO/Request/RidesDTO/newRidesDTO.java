package leyans.RidersHub.DTO.Request.RidesDTO;

public class newRidesDTO {
    private String username;
    private String locationName;
    private double latitude;
    private double longitude;
    private double distance;

    public newRidesDTO() {}
    public newRidesDTO(String username, String locationName, double latitude, double longitude, double distance) {
        this.username = username;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.distance = distance;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public double getDistance() {
        return distance;
    }

    public void setDistance(double distance) {
        this.distance = distance;
    }
}

