package leyans.RidersHub.Service;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import leyans.RidersHub.Utility.AppLogger;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class UploadService {

    private final Cloudinary cloudinary;

    public UploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadSnapshot(byte[] imageBytes) {
        try {
            Map uploadResult = cloudinary.uploader().upload(imageBytes, ObjectUtils.asMap(
                    "resource_type", "image",
                    "folder", "ride_snapshots"
            ));
            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            AppLogger.error(this.getClass(), "Cloudinary upload failed", "error", e.getMessage());
            throw new RuntimeException("Cloudinary upload failed: " + e.getMessage(), e);
        }
    }


}
