package leyans.RidersHub.DTO.Response.FinishedDTO;

public class SnapshotResponseDTO {
    private String snapshotUrl;

    public SnapshotResponseDTO() {}

    public SnapshotResponseDTO(String snapshotUrl) {
        this.snapshotUrl = snapshotUrl;
    }

    public String getSnapshotUrl() { return snapshotUrl; }
    public void setSnapshotUrl(String snapshotUrl) { this.snapshotUrl = snapshotUrl; }
}
