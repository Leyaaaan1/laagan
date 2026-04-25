package leyans.RidersHub.Service.MapService.MapBox;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class UploadImageService {

    private final Cloudinary cloudinary;
    private final ImageOptimizationService imageOptimizer;

    private final RestTemplate restTemplate;

    public UploadImageService(Cloudinary cloudinary, ImageOptimizationService imageOptimizer, RestTemplate restTemplate) {
        this.cloudinary = cloudinary;
        this.imageOptimizer = imageOptimizer;
        this.restTemplate = restTemplate;
    }

    public String uploadMapImage(String mapboxImageUrl) {
        try {
            ResponseEntity<byte[]> imageResponse = restTemplate.getForEntity(mapboxImageUrl, byte[].class);

            if (imageResponse.getStatusCode().is2xxSuccessful()) {
                byte[] imageBytes = imageResponse.getBody();

                // ✅ NEW: Optimize image before upload
                byte[] optimizedBytes = imageOptimizer.compressImage(imageBytes);

                System.out.println("📊 Size reduction: " + imageBytes.length +
                        " → " + optimizedBytes.length + " bytes (" +
                        (100 - (optimizedBytes.length * 100 / imageBytes.length)) + "% smaller)");

                Map uploadResult = cloudinary.uploader().upload(optimizedBytes,
                        ObjectUtils.asMap("resource_type", "image"));

                return uploadResult.get("secure_url").toString();
            }
        } catch (Exception e) {
            System.err.println("Image upload failed: " + e.getMessage());
        }
        return null;
    }

    public String uploadQrCodeBase64(String base64Qr, String folder) {
        try {
            String payload = base64Qr.startsWith("data:") ? base64Qr : ("data:image/png;base64," + base64Qr);
            Map uploadResult = cloudinary.uploader().upload(payload, ObjectUtils.asMap(
                    "resource_type", "image",
                    "folder", folder != null ? folder : "qr_codes"
            ));
            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            throw new RuntimeException("QR upload failed: " + e.getMessage(), e);
        }
    }
}
