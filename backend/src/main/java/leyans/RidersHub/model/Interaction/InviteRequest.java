package leyans.RidersHub.model.Interaction;


import jakarta.persistence.*;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "invite_requests",
        indexes = {
                @Index(name = "idx_invite_token", columnList = "inviteToken"),
                @Index(name = "idx_ride_id", columnList = "generatedRidesId"),
        })
public class InviteRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invite_id")
    private Integer inviteId;

    @Column(name = "inviteToken",  unique = true)
    private String inviteToken;

    @ManyToOne
    @JoinColumn(name = "generatedRidesId", referencedColumnName = "generatedRidesId")
    private Rides rides;

    @ManyToOne
    @JoinColumn(name = "username", referencedColumnName = "username")
    private Rider username;

    @Enumerated(EnumType.STRING)
    @Column(name = "inviteStatus")
    private InviteStatus inviteStatus;

    @Column(name = "qr")
    private String qr;

    @Column(name = "invite_link" )
    private String inviteLink;



    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "expiresAt")
    private LocalDateTime expiresAt;

    @Column(name = "qr_code_base64", columnDefinition = "TEXT")
    private String qrCodeBase64;

    public InviteRequest(Rides generatedRidesId, Rider creator, InviteStatus inviteStatus, LocalDateTime createdAt, LocalDateTime expiresAt) {
        this();
        this.rides = generatedRidesId;
        this.username = creator;
        this.inviteStatus = inviteStatus;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }



    public enum InviteStatus {
        PENDING,
        ACCEPTED,
        DECLINED,

        EXPIRED
    }


    public InviteRequest() {
        this.inviteToken = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
        this.inviteStatus = InviteStatus.PENDING;
    }

    public InviteRequest(Integer inviteId, String inviteToken, Rides rides, Rider username, InviteStatus inviteStatus, String qr, LocalDateTime createdAt, LocalDateTime expiresAt, String qrCodeBase64, String inviteLink) {
        this.inviteId = inviteId;
        this.inviteToken = inviteToken;
        this.rides = rides;
        this.username = username;
        this.inviteStatus = inviteStatus;
        this.inviteLink = inviteLink;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.qrCodeBase64 = qrCodeBase64;
    }

    public String getQr() {
        return qr;
    }

    public void setQr(String qr) {
        this.qr = qr;
    }

    public String getInviteLink() {
        return inviteLink;
    }

    public void setInviteLink(String inviteLink) {
        this.inviteLink = inviteLink;
    }

    public Integer getInviteId() {
        return inviteId;
    }

    public void setInviteId(Integer inviteId) {
        this.inviteId = inviteId;
    }

    public String getInviteToken() {
        return inviteToken;
    }

    public void setInviteToken(String inviteToken) {
        this.inviteToken = inviteToken;
    }

    public Rides getRides() {
        return rides;
    }

    public void setRides(Rides rides) {
        this.rides = rides;
    }

    public Rider getUsername() {
        return username;
    }

    public void setUsername(Rider username) {
        this.username = username;
    }

    public InviteStatus getInviteStatus() {
        return inviteStatus;
    }

    public void setInviteStatus(InviteStatus inviteStatus) {
        this.inviteStatus = inviteStatus;
    }



    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getQrCodeBase64() {
        return qrCodeBase64;
    }

    public void setQrCodeBase64(String qrCodeBase64) {
        this.qrCodeBase64 = qrCodeBase64;
    }
}
