package leyans.RidersHub.DTO.Response;

import java.util.Objects;

public class LocationImageResponse {
    private String locationName;
    private String imageUrl;
    private String description;
    private String author;
    private String license;

    // No-args constructor
    public LocationImageResponse() {
    }

    // All-args constructor
    public LocationImageResponse(String locationName, String imageUrl, String description, String author, String license) {
        this.locationName = locationName;
        this.imageUrl = imageUrl;
        this.description = description;
        this.author = author;
        this.license = license;
    }

    // Getters and setters
    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LocationImageResponse that = (LocationImageResponse) o;
        return Objects.equals(locationName, that.locationName) &&
                Objects.equals(imageUrl, that.imageUrl) &&
                Objects.equals(description, that.description) &&
                Objects.equals(author, that.author) &&
                Objects.equals(license, that.license);
    }

    @Override
    public int hashCode() {
        return Objects.hash(locationName, imageUrl, description, author, license);
    }

    // toString
    @Override
    public String toString() {
        return "LocationImageResponse{" +
                "locationName='" + locationName + '\'' +
                ", imageUrl='" + imageUrl + '\'' +
                ", description='" + description + '\'' +
                ", author='" + author + '\'' +
                ", license='" + license + '\'' +
                '}';
    }
}

