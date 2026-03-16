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
    private final RestTemplate restTemplate;

    @Autowired
    public UploadImageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
        this.restTemplate = new RestTemplate();


    }
    public String uploadMapImage(String mapboxImageUrl) {
        try {
            ResponseEntity<byte[]> imageResponse = restTemplate.getForEntity(mapboxImageUrl, byte[].class);

            if (imageResponse.getStatusCode().is2xxSuccessful()) {
                byte[] imageBytes = imageResponse.getBody();
                Map uploadResult = cloudinary.uploader().upload(imageBytes, ObjectUtils.asMap(
                        "resource_type", "image"
                ));

                return uploadResult.get("secure_url").toString();
            } else {
                System.err.println("Mapbox API error: " + imageResponse.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("Image upload failed: " + e.getMessage());
            e.printStackTrace(); // Add this for more detailed error information
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
