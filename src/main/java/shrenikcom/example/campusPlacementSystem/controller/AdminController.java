package shrenikcom.example.campusPlacementSystem.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import shrenikcom.example.campusPlacementSystem.dto.UserResponse;
import shrenikcom.example.campusPlacementSystem.entity.*;
import shrenikcom.example.campusPlacementSystem.service.AdminService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    private User checkAdmin(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        if (user == null || user.getRole() != Role.ADMIN)
            throw new RuntimeException("Only admin allowed");
        return user;
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest req) {
        checkAdmin(req);
        return ResponseEntity.ok(adminService.getAllUsers(page, size));
    }

    @DeleteMapping("/user/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.deleteUser(id, admin.getEmail()));
    }

    @PutMapping("/block/{userId}")
    public ResponseEntity<String> blockUser(@PathVariable Long userId, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.blockUser(userId, admin.getEmail()));
    }

    @PutMapping("/unblock/{userId}")
    public ResponseEntity<String> unblockUser(@PathVariable Long userId, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.unblockUser(userId, admin.getEmail()));
    }

    // ── Companies ─────────────────────────────────────────────────────────────
    @PutMapping("/approve/{userId}")
    public ResponseEntity<String> approveCompany(@PathVariable Long userId, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.approveCompany(userId, admin.getEmail()));
    }

    @PutMapping("/reject/{userId}")
    public ResponseEntity<String> rejectCompany(@PathVariable Long userId, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.rejectCompany(userId, admin.getEmail()));
    }

    // ── Jobs ──────────────────────────────────────────────────────────────────
    @GetMapping("/jobs")
    public ResponseEntity<Page<Job>> getAllJobs(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "15") int size,
            HttpServletRequest req) {
        checkAdmin(req);
        return ResponseEntity.ok(adminService.getAllJobs(page, size));
    }

    @DeleteMapping("/job/{id}")
    public ResponseEntity<String> deleteJob(@PathVariable Long id, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.deleteJob(id, admin.getEmail()));
    }

    @PutMapping("/job/{id}/status")
    public ResponseEntity<String> updateJobStatus(@PathVariable Long id,
                                                  @RequestParam String status,
                                                  HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.updateJobStatus(id, status, admin.getEmail()));
    }

    @PutMapping("/job/{id}/flag")
    public ResponseEntity<String> toggleJobFlag(@PathVariable Long id, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.toggleJobFlag(id, admin.getEmail()));
    }

    // ── Applications ─────────────────────────────────────────────────────────
    @GetMapping("/applications")
    public ResponseEntity<List<Map<String, Object>>> getAllApplications(HttpServletRequest req) {
        checkAdmin(req);
        return ResponseEntity.ok(adminService.getAllApplications());
    }

    // ── Notifications / Broadcast ─────────────────────────────────────────────
    @PostMapping("/broadcast")
    public ResponseEntity<String> broadcast(@RequestBody Map<String, String> body,
                                            HttpServletRequest req) {
        User admin = checkAdmin(req);
        String message    = body.get("message");
        String targetRole = body.getOrDefault("targetRole", "ALL");
        return ResponseEntity.ok(adminService.broadcast(message, targetRole, admin.getEmail()));
    }

    // ── Audit Logs ────────────────────────────────────────────────────────────
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs(HttpServletRequest req) {
        checkAdmin(req);
        return ResponseEntity.ok(adminService.getAuditLogs());
    }

    // ── Platform Stats ────────────────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(HttpServletRequest req) {
        checkAdmin(req);
        return ResponseEntity.ok(adminService.getPlatformStats());
    }
}
