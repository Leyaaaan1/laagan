package leyans.RidersHub.DTO.Response;

//LocationResponseDTO  more detailed version of LocationDTO ,
//DTOs for the REST response (LocationResponseDTO).
// two DTO For maintainability and clear separation of concerns
public class LocationResponseDTO {
    private String username;
    private String locationName;
    private double latitude;
    private double longitude;

    public LocationResponseDTO(String locationName, String username, double latitude, double longitude) {

        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.username = username;
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
}
