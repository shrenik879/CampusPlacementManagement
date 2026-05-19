package shrenikcom.example.campusPlacementSystem.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import shrenikcom.example.campusPlacementSystem.dto.ParsedResume;
import org.springframework.web.multipart.MultipartFile;
import shrenikcom.example.campusPlacementSystem.entity.Role;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.repository.UserRepository;
import shrenikcom.example.campusPlacementSystem.service.ApplicationService;
import shrenikcom.example.campusPlacementSystem.service.FileUploadService;
import shrenikcom.example.campusPlacementSystem.service.ResumeParserService;

import java.io.ByteArrayInputStream;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final ResumeParserService resumeParserService;

    @PostMapping("/apply/{jobId}")
    public String applyJob(@PathVariable Long jobId,
                           HttpServletRequest request) {

        User user = (User) request.getAttribute("user");

        if (user == null) {
            throw new RuntimeException("User not authenticated");
        }

        if (!user.getRole().toString().equals("STUDENT")) {
            throw new RuntimeException("Only students can apply");
        }

        return applicationService.applyJob(jobId, user.getId());
    }

    @GetMapping("/job/{jobId}")
    public List<Map<String, Object>> getApplicants(@PathVariable Long jobId,
                                           HttpServletRequest request) {

        User user = (User) request.getAttribute("user");

        if (user == null) {
            throw new RuntimeException("User not authenticated");
        }

        if (user.getRole() != Role.COMPANY) {
            throw new RuntimeException("Only companies can view applicants");
        }

        return applicationService.getApplicants(jobId);
    }

    /**
     * GET /api/applications/job/{jobId}/paged?status=&page=0&size=10
     * Paginated applicants for a specific job.
     */
    @GetMapping("/job/{jobId}/paged")
    public ResponseEntity<Page<Map<String, Object>>> getApplicantsPaged(
            @PathVariable Long jobId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {

        User user = (User) request.getAttribute("user");
        if (user == null) throw new RuntimeException("User not authenticated");
        if (user.getRole() != Role.COMPANY) throw new RuntimeException("Only companies can view applicants");

        return ResponseEntity.ok(applicationService.getApplicantsPaged(jobId, status, page, size));
    }

    @PutMapping("/status/{applicationId}")
    public String updateStatus(
            @PathVariable Long applicationId,
            @RequestParam String status,
            HttpServletRequest request
    ) {
        User user = (User) request.getAttribute("user");
        if (user == null) {
            throw new RuntimeException("User not authenticated");
        }
        if (!user.getRole().toString().equals("COMPANY")) {
            throw new RuntimeException("Only companies can update status");
        }
        return applicationService.updateStatus(applicationId, status);
    }

    @GetMapping("/my")
    public List<Map<String, Object>> getMyApplications(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        if (user == null) {
            throw new RuntimeException("User not authenticated");
        }
        if (user.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can view their applications");
        }
        return applicationService.getMyApplications(user.getId());
    }

    /**
     * GET /api/applications/my/paged?status=&page=0&size=10
     * Paginated student applications with optional status filter.
     */
    @GetMapping("/my/paged")
    public ResponseEntity<Page<Map<String, Object>>> getMyApplicationsPaged(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {

        User user = (User) request.getAttribute("user");
        if (user == null) throw new RuntimeException("User not authenticated");
        if (user.getRole() != Role.STUDENT) throw new RuntimeException("Only students can view their applications");

        return ResponseEntity.ok(applicationService.getMyApplicationsPaged(user.getId(), status, page, size));
    }

    @PostMapping("/upload-resume")
    public ResponseEntity<Map<String, String>> uploadResume(@RequestParam("file") MultipartFile file,
                               HttpServletRequest request) {

        User user = (User) request.getAttribute("user");

        if (user == null) {
            throw new RuntimeException("User not authenticated");
        }

        if (user.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can upload resume");
        }

        // Store the Cloudinary publicId (not the URL) in resumeUrl field
        String publicId = fileUploadService.uploadFile(file);
        user.setResumeUrl(publicId);

        // ── Auto-parse resume and merge extracted skills ─────────────────────
        try {
            byte[] pdfBytes = file.getBytes();
            ParsedResume parsed = resumeParserService.parse(new ByteArrayInputStream(pdfBytes));

            if (parsed.getSkills() != null && !parsed.getSkills().isEmpty()) {
                // Merge with existing skills
                java.util.Set<String> skillSet = new java.util.LinkedHashSet<>();
                if (user.getSkills() != null && !user.getSkills().isBlank()) {
                    for (String s : user.getSkills().split(",")) {
                        String trimmed = s.trim().toLowerCase();
                        if (!trimmed.isEmpty()) skillSet.add(trimmed);
                    }
                }
                for (String s : parsed.getSkills()) {
                    skillSet.add(s.toLowerCase());
                }
                user.setSkills(String.join(", ", skillSet));
            }
        } catch (Exception e) {
            // Auto-parse is best-effort — don't fail the upload if parsing fails
        }

        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Resume uploaded successfully");
        response.put("resumeUrl", publicId);
        response.put("skills", user.getSkills() != null ? user.getSkills() : "");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/download-resume")
    public ResponseEntity<byte[]> downloadResume(HttpServletRequest request) {

        User user = (User) request.getAttribute("user");

        if (user == null) {
            throw new RuntimeException("User not authenticated");
        }

        String publicId = user.getResumeUrl();
        if (publicId == null || publicId.isBlank()) {
            throw new RuntimeException("No resume uploaded yet");
        }

        // Fetch PDF bytes through Cloudinary API (bypasses CDN raw file restriction)
        byte[] pdfBytes = fileUploadService.downloadResumeBytes(publicId);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "inline; filename=\"resume.pdf\"")
                .body(pdfBytes);
    }
    @GetMapping("/download-resume/admin")
    public ResponseEntity<byte[]> downloadResumeAdmin(
            @RequestParam String publicId, 
            HttpServletRequest request) {

        User user = (User) request.getAttribute("user");

        if (user == null) {
            throw new RuntimeException("User not authenticated");
        }

        // Technically both COMPANY and ADMIN can download resumes, we'll just allow any authenticated user for simplicity,
        // or check for COMPANY/ADMIN.
        if (user.getRole() == Role.STUDENT) {
            throw new RuntimeException("Students cannot download arbitrary resumes");
        }

        byte[] pdfBytes = fileUploadService.downloadResumeBytes(publicId);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "inline; filename=\"resume.pdf\"")
                .body(pdfBytes);
    }

    /**
     * PUT /api/applications/skills
     * Lets a student save/update their comma-separated skills string.
     */
    @PutMapping("/skills")
    public ResponseEntity<Map<String, String>> updateSkills(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        User user = (User) request.getAttribute("user");
        if (user == null) throw new RuntimeException("User not authenticated");
        if (user.getRole() != Role.STUDENT) throw new RuntimeException("Only students can update skills");

        user.setSkills(body.getOrDefault("skills", ""));
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Skills updated successfully");
        response.put("skills", user.getSkills());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/applications/parse-resume
     * Parses the authenticated student's uploaded resume and returns extracted data.
     */
    @GetMapping("/parse-resume")
    public ResponseEntity<ParsedResume> parseResume(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        if (user == null) throw new RuntimeException("User not authenticated");
        if (user.getRole() != Role.STUDENT) throw new RuntimeException("Only students can parse resumes");

        String publicId = user.getResumeUrl();
        if (publicId == null || publicId.isBlank()) {
            throw new RuntimeException("No resume uploaded yet. Upload a resume first.");
        }

        // Download the PDF bytes from Cloudinary
        byte[] pdfBytes = fileUploadService.downloadResumeBytes(publicId);

        // Parse the PDF
        ParsedResume parsed = resumeParserService.parse(new ByteArrayInputStream(pdfBytes));

        return ResponseEntity.ok(parsed);
    }

}
