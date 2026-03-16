package leyans.RidersHub.DTO.Request.LocationDTO;


import java.util.Objects;

public class LocationImageRequest {
    private String locationName;
    private int limit = 2; // Default number of images to return

    // No-args constructor
    public LocationImageRequest() {
    }

    // All-args constructor
    public LocationImageRequest(String locationName, int limit) {
        this.locationName = locationName;
        this.limit = limit;
    }

    // Getters and setters
    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public int getLimit() {
        return limit;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LocationImageRequest that = (LocationImageRequest) o;
        return limit == that.limit && Objects.equals(locationName, that.locationName);
    }

    @Override
    public int hashCode() {
        return Objects.hash(locationName, limit);
    }

    // toString
    @Override
    public String toString() {
        return "LocationImageRequest{" +
                "locationName='" + locationName + '\'' +
                ", limit=" + limit +
                '}';
    }
}