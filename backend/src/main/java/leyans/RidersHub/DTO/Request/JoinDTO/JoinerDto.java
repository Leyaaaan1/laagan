package leyans.RidersHub.DTO.Request.JoinDTO;

import leyans.RidersHub.model.Interaction.JoinRequest;

import java.time.LocalDateTime;

public class JoinerDto {

    private Integer joinId;
    private String username;

    private JoinRequest.JoinStatus status;
    private LocalDateTime requestedAt;


    public JoinerDto(JoinRequest jr) {
        this.joinId = jr.getJoinId();
        this.username = jr.getRequester().getUsername();
        this.status = jr.getJoinStatus();
        this.requestedAt = jr.getRequestedAt();
    }

    public JoinerDto(String username, JoinRequest.JoinStatus status, LocalDateTime requestedAt) {
        this.username = username;
        this.status = status;
        this.requestedAt = requestedAt;
    }

    public Integer getJoinId() { return joinId; }
    public void setJoinId(Integer joinId) { this.joinId = joinId; }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public JoinRequest.JoinStatus getStatus() {
        return status;
    }

    public void setStatus(JoinRequest.JoinStatus status) {
        this.status = status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }
}
