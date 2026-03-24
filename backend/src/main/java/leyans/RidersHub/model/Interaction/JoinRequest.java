package leyans.RidersHub.model.Interaction;

import jakarta.persistence.*;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;

import java.time.LocalDateTime;

@Entity
@Table(name = "join_requests",
        indexes = {
                @Index(name = "idx_join_ride_requester", columnList = "generated_rides_id, username"),
                @Index(name = "idx_join_status", columnList = "join_status")
        })
public class JoinRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "join_id")
    private Integer joinId;

    @ManyToOne
    @JoinColumn(name = "generated_rides_id", referencedColumnName = "generated_rides_id", nullable = false)
    private Rides generatedRidesId;

    @ManyToOne
    @JoinColumn(name = "username", referencedColumnName = "username", nullable = false)
    private Rider requester;

    @Column(name = "invite_token", nullable = false)
    private String inviteToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "join_status", nullable = false)
    private JoinStatus joinStatus = JoinStatus.PENDING;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    public JoinRequest() {
        this.requestedAt = LocalDateTime.now();
        this.joinStatus = JoinStatus.PENDING;
    }

    public JoinRequest(Rides generatedRidesId, Rider requester, String inviteToken) {
        this();
        this.generatedRidesId = generatedRidesId;
        this.requester = requester;
        this.inviteToken = inviteToken;
    }

    public enum JoinStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    public Integer getJoinId() {
        return joinId;
    }

    public void setJoinId(Integer joinId) {
        this.joinId = joinId;
    }

    public Rides getGeneratedRidesId() {
        return generatedRidesId;
    }

    public void setGeneratedRidesId(Rides generatedRidesId) {
        this.generatedRidesId = generatedRidesId;
    }

    public Rider getRequester() {
        return requester;
    }

    public void setRequester(Rider requester) {
        this.requester = requester;
    }

    public String getInviteToken() {
        return inviteToken;
    }

    public void setInviteToken(String inviteToken) {
        this.inviteToken = inviteToken;
    }

    public JoinStatus getJoinStatus() {
        return joinStatus;
    }

    public void setJoinStatus(JoinStatus joinStatus) {
        this.joinStatus = joinStatus;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }
}