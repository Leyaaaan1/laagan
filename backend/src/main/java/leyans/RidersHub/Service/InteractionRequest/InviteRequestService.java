package leyans.RidersHub.Service.InteractionRequest;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import leyans.RidersHub.Repository.Auth.InviteRequestRepository;
import leyans.RidersHub.Service.MapService.MapBox.UploadImageService;
import leyans.RidersHub.Utility.RiderUtil;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.Rides;
import leyans.RidersHub.model.Interaction.InviteRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class InviteRequestService {

    private final InviteRequestRepository inviteRequestRepository;
    private final UploadImageService uploadImageService;


    private final RiderUtil riderUtil;

    @Value("${baseurl}")
    private String baseUrl;


    public InviteRequestService(InviteRequestRepository inviteRequestRepository, UploadImageService uploadImageService, RiderUtil riderUtil) {
        this.inviteRequestRepository = inviteRequestRepository;
        this.uploadImageService = uploadImageService;
        this.riderUtil = riderUtil;
    }

    @Transactional
    public InviteRequest generateInviteForNewRide(String generatedRidesId,
                                                  Rider creator,
                                                  InviteRequest.InviteStatus inviteStatus,
                                                  LocalDateTime createdAt,
                                                  LocalDateTime expiresAt) {

        System.out.println("📋 [INVITE] Generating invite for ride: " + generatedRidesId);

        try {
            // ✅ NEW: Validate inputs before processing
            if (generatedRidesId == null || generatedRidesId.isBlank()) {
                throw new IllegalArgumentException("Ride ID cannot be empty");
            }
            if (creator == null) {
                throw new IllegalArgumentException("Creator cannot be null");
            }

            // Fetch the ride
            Rides ride = riderUtil.findRideById(generatedRidesId);

            // Create invite request
            InviteRequest inviteLink = new InviteRequest(ride, creator, inviteStatus, createdAt, expiresAt);

            // Build invite URL
            String inviteUrl = baseUrl + "/invite/link/" + inviteLink.getInviteToken();
            inviteLink.setInviteLink(inviteUrl);

            // Generate QR code in Base64
            String qrCodeBase64 = generateQRCodeBase64(inviteUrl);
            inviteLink.setQrCodeBase64(qrCodeBase64);

            String cloudinaryUrl = uploadQrCodeWithFallback(qrCodeBase64, generatedRidesId);

            if (cloudinaryUrl != null) {
                inviteLink.setQr(cloudinaryUrl);
            } else {
                inviteLink.setQr("data:image/png;base64," + qrCodeBase64);
            }

            System.out.println("🎫 Invite token: " + inviteLink.getInviteToken());

            // Save to database
            InviteRequest savedInvite = inviteRequestRepository.save(inviteLink);
            System.out.println("✅ Invite saved with ID: " + savedInvite.getInviteId());

            return savedInvite;

        } catch (IllegalArgumentException e) {
            System.err.println("❌ [INVITE] Validation error: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("❌ [INVITE] Error generating invite: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to generate invite: " + e.getMessage(), e);
        }
    }


    private String uploadQrCodeWithFallback(String qrCodeBase64, String rideId) {
        try {
            System.out.println("☁️  [CLOUDINARY] Uploading QR code for ride: " + rideId);

            String cloudinaryUrl = uploadImageService.uploadQrCodeBase64(
                    qrCodeBase64,
                    "ride_invites"
            );

            if (cloudinaryUrl != null && !cloudinaryUrl.isBlank()) {
                System.out.println("✅ [CLOUDINARY] Upload successful");
                return cloudinaryUrl;
            } else {
                System.err.println("⚠️  [CLOUDINARY] Returned null URL");
                return null;
            }

        } catch (Exception e) {
            System.err.println("❌ [CLOUDINARY] Upload failed: " + e.getMessage());
            System.err.println("   💡 Tip: Invite will use Base64 QR code instead");
            return null; // Return null, not throw exception
        }
    }
    private String generateQRCodeBase64(String urlToken) {

        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(urlToken, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] qrCodeBytes = pngOutputStream.toByteArray();

            return Base64.getEncoder().encodeToString(qrCodeBytes);

        } catch (WriterException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }



    }


}