package leyans.RidersHub.DTO.Request.LocationDTO;

public class LocationImageDto {
    private String imageUrl;
    private String author;
    private String license;

    public LocationImageDto() {}

    public LocationImageDto(String imageUrl, String author, String license) {
        this.imageUrl = imageUrl;
        this.author = author;
        this.license = license;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getLicense() {
        return license;
    }

    public void setLicense(String license) {
        this.license = license;
    }
}
