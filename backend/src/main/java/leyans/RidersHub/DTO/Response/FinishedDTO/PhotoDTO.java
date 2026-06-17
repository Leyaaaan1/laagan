package leyans.RidersHub.DTO.Response.FinishedDTO;

public class PhotoDTO {
    private Long id;
    private String imageUrl;
    private String caption;
    private String uploadedBy;
    private String uploadedAt;

    public PhotoDTO() {}

    public PhotoDTO(Long id, String imageUrl, String caption, String uploadedBy, String uploadedAt) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.caption = caption;
        this.uploadedBy = uploadedBy;
        this.uploadedAt = uploadedAt;
    }

    // standard getters/setters for all fields
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    public String getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(String uploadedAt) { this.uploadedAt = uploadedAt; }
}