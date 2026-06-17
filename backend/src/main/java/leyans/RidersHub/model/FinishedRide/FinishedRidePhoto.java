package leyans.RidersHub.model.FinishedRide;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "finished_ride_photos")
public class FinishedRidePhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "generated_rides_id", nullable = false)
    private String generatedRidesId;

    @Column(name = "image_url", nullable = false, length = 512)
    private String imageUrl;

    @Column(name = "caption", length = 255)
    private String caption;

    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    public FinishedRidePhoto() {}

    public FinishedRidePhoto(String generatedRidesId, String imageUrl,
                             String caption, String uploadedBy) {
        this.generatedRidesId = generatedRidesId;
        this.imageUrl = imageUrl;
        this.caption = caption;
        this.uploadedBy = uploadedBy;
        this.uploadedAt = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() { return id; }
    public String getGeneratedRidesId() { return generatedRidesId; }
    public void setGeneratedRidesId(String v) { this.generatedRidesId = v; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String v) { this.imageUrl = v; }
    public String getCaption() { return caption; }
    public void setCaption(String v) { this.caption = v; }
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String v) { this.uploadedBy = v; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime v) { this.uploadedAt = v; }
}