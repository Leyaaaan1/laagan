package leyans.RidersHub.Service.MapService.MapBox;


import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class ImageOptimizationService {

    private static final int MAX_WIDTH = 1200;
    private static final int MAX_HEIGHT = 800;
    private static final int QUALITY = 75; // 0-100, lower = smaller file

    public byte[] compressImage(byte[] originalImage) throws IOException {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(originalImage));

        // Resize if too large
        if (image.getWidth() > MAX_WIDTH || image.getHeight() > MAX_HEIGHT) {
            double aspectRatio = (double) image.getWidth() / image.getHeight();
            int newWidth = MAX_WIDTH;
            int newHeight = (int) (MAX_WIDTH / aspectRatio);

            if (newHeight > MAX_HEIGHT) {
                newHeight = MAX_HEIGHT;
                newWidth = (int) (MAX_HEIGHT * aspectRatio);
            }

            Image scaledImage = image.getScaledInstance(newWidth, newHeight, Image.SCALE_SMOOTH);
            BufferedImage optimized = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = optimized.createGraphics();
            g2d.drawImage(scaledImage, 0, 0, null);
            g2d.dispose();
            image = optimized;
        }

        // Compress with JPEG quality
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
        ImageOutputStream ios = ImageIO.createImageOutputStream(output);
        writer.setOutput(ios);

        ImageWriteParam writeParam = writer.getDefaultWriteParam();
        writeParam.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        writeParam.setCompressionType("JPEG");
        writeParam.setCompressionQuality((float) QUALITY / 100);

        writer.write(null, new IIOImage(image, null, null), writeParam);
        writer.dispose();

        return output.toByteArray();
    }
}