package shrenikcom.example.campusPlacementSystem.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.URL;
import java.util.Map;

@Service
public class FileUploadService {
    private final Cloudinary cloudinary;

    public FileUploadService(Cloudinary cloudinary){
        this.cloudinary = cloudinary;
    }

    // Upload PDF and return the actual publicId from Cloudinary's response
    public String uploadFile(MultipartFile file) {
        try {
            String publicId = "resumes/resume_" + System.currentTimeMillis();

            // Upload as private resource — privateDownload is designed exactly for this type
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "resource_type", "raw",
                    "type", "private",
                    "public_id", publicId
            ));

            // Verify upload actually succeeded
            if (uploadResult == null || uploadResult.get("public_id") == null) {
                throw new RuntimeException("Cloudinary returned empty result — upload failed");
            }

            String actualPublicId = uploadResult.get("public_id").toString();
            String secureUrl     = uploadResult.get("secure_url").toString();

            System.out.println("✅ Cloudinary upload success!");
            System.out.println("   public_id   : " + actualPublicId);
            System.out.println("   secure_url  : " + secureUrl);
            System.out.println("   resource_type: " + uploadResult.get("resource_type"));
            System.out.println("   type        : " + uploadResult.get("type"));
            System.out.println("   bytes       : " + uploadResult.get("bytes"));

            return actualPublicId; // saved to DB

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Upload error: " + e.getMessage());
        }
    }

    // Download the actual PDF bytes through Cloudinary's API (bypasses CDN restriction)
    public byte[] downloadResumeBytes(String publicId) {
        try {
            System.out.println("⬇️  Downloading resume for publicId: " + publicId);

            // privateDownload works perfectly for type=private resources
            String downloadUrl = cloudinary.privateDownload(
                    publicId,
                    "",                                          // no format — use exact publicId
                    ObjectUtils.asMap(
                            "resource_type", "raw",
                            "type", "private"                   // must match the upload type
                    )
            );

            System.out.println("   download URL: " + downloadUrl);

            // Fetch PDF bytes from Cloudinary API server
            try (InputStream in = new URL(downloadUrl).openStream()) {
                return in.readAllBytes();
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Download error: " + e.getMessage());
        }
    }
}

