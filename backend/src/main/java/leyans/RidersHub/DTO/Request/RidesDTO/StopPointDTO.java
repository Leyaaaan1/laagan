package leyans.RidersHub.DTO.Request.RidesDTO;

public class StopPointDTO {

    private double stopLatitude;
    private double stopLongitude;

    private String stopName;

    public StopPointDTO() {
    }

    public StopPointDTO(String stopName, double stopLongitude, double stopLatitude) {
        this.stopName = stopName;
        this.stopLongitude = stopLongitude;
        this.stopLatitude = stopLatitude;
    }

    public double getStopLatitude() {
        return stopLatitude;
    }

    public void setStopLatitude(double stopLatitude) {
        this.stopLatitude = stopLatitude;
    }

    public double getStopLongitude() {
        return stopLongitude;
    }

    public void setStopLongitude(double stopLongitude) {
        this.stopLongitude = stopLongitude;
    }

    public String getStopName() {
        return stopName;
    }

    public void setStopName(String stopName) {
        this.stopName = stopName;
    }
}
