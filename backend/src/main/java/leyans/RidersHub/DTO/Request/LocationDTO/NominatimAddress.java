package leyans.RidersHub.DTO.Request.LocationDTO;

public record NominatimAddress(String barangay, String cityMun, String province, String landmark) {



    public static NominatimAddress forLandmark(String landmark) {
        return new NominatimAddress(null, null, null, landmark);
    }



    public Boolean isLandmark() {
        return landmark != null;
    }

    // Fixed getters - use correct field names
    public String getBarangay() { return barangay; }
    public String getCity() { return cityMun; }  // This should return cityMun
    public String getCityMun() { return cityMun; }
    public String getProvince() { return province; }
    public String getLandmark() { return landmark; }
}