package leyans.RidersHub.DTO.Request.LocationDTO;


//LocationDTO is used in the LocationKafkaConsumer class to receive location updates from Kafka.
//DTOs for Kafka message (LocationDTO)
// and one for the REST response (LocationResponseDTO).
// two DTO For maintainability and clear separation of concerns
public class LocationDTO {
    private String username;
    private String locationName;
    private String point;

    public LocationDTO() {}

    public LocationDTO(String username, String locationName, String point) {
        this.username = username;
        this.locationName = locationName;
        this.point = point;
    }

    public LocationDTO(String username, String locationName, double latitude, double longitude) {
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
    public String getPoint() {
        return point;
    }
    public void setPoint(String point) {
        this.point = point;
    }
}
