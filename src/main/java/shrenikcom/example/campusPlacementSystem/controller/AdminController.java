package shrenikcom.example.campusPlacementSystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Admin", description = "Admin-only endpoints: user management, company approval, job moderation, audit logs.")
@SecurityRequirement(name = "BearerAuth")
public class AdminController {

    private final AdminService adminService;

    private User checkAdmin(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        if (user == null || user.getRole() != Role.ADMIN)
            throw new RuntimeException("Only admin allowed");
        return user;
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    @Operation(summary = "Get All Users", description = "Returns a paginated list of all registered users (students + companies). ADMIN role required.")
    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest req) {
        checkAdmin(req);
        return ResponseEntity.ok(adminService.getAllUsers(page, size));
    }

    @Operation(summary = "Delete User", description = "Permanently deletes a user account by ID. ADMIN role required. Action is logged in the audit trail.")
    @DeleteMapping("/user/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.deleteUser(id, admin.getEmail()));
    }

    @Operation(summary = "Block User", description = "Blocks a user account, preventing login. ADMIN role required.")
    @PutMapping("/block/{userId}")
    public ResponseEntity<String> blockUser(@PathVariable Long userId, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.blockUser(userId, admin.getEmail()));
    }

    @Operation(summary = "Unblock User", description = "Restores access to a previously blocked user account. ADMIN role required.")
    @PutMapping("/unblock/{userId}")
    public ResponseEntity<String> unblockUser(@PathVariable Long userId, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.unblockUser(userId, admin.getEmail()));
    }

    // ── Companies ─────────────────────────────────────────────────────────────
    @Operation(summary = "Approve Company", description = "Approves a COMPANY account so they can post jobs and manage applications. ADMIN role required.")
    @PutMapping("/approve/{userId}")
    public ResponseEntity<String> approveCompany(@PathVariable Long userId, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.approveCompany(userId, admin.getEmail()));
    }

    @Operation(summary = "Reject Company", description = "Rejects a COMPANY account registration. ADMIN role required.")
    @PutMapping("/reject/{userId}")
    public ResponseEntity<String> rejectCompany(@PathVariable Long userId, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.rejectCompany(userId, admin.getEmail()));
    }

    // ── Jobs ──────────────────────────────────────────────────────────────────
    @Operation(summary = "Get All Jobs", description = "Returns a paginated list of all job listings across all companies. ADMIN role required.")
    @GetMapping("/jobs")
    public ResponseEntity<Page<Job>> getAllJobs(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "15") int size,
            HttpServletRequest req) {
        checkAdmin(req);
        return ResponseEntity.ok(adminService.getAllJobs(page, size));
    }

    @Operation(summary = "Delete Job", description = "Permanently removes a job listing from the platform. ADMIN role required. Action is logged.")
    @DeleteMapping("/job/{id}")
    public ResponseEntity<String> deleteJob(@PathVariable Long id, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.deleteJob(id, admin.getEmail()));
    }

    @Operation(summary = "Update Job Status", description = "Change the status of a job (e.g., OPEN, CLOSED, FLAGGED). ADMIN role required.")
    @PutMapping("/job/{id}/status")
    public ResponseEntity<String> updateJobStatus(@PathVariable Long id,
                                                  @RequestParam String status,
                                                  HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.updateJobStatus(id, status, admin.getEmail()));
    }

    @Operation(summary = "Toggle Job Flag", description = "Flags or unflags a suspicious job listing for review. ADMIN role required.")
    @PutMapping("/job/{id}/flag")
    public ResponseEntity<String> toggleJobFlag(@PathVariable Long id, HttpServletRequest req) {
        User admin = checkAdmin(req);
        return ResponseEntity.ok(adminService.toggleJobFlag(id, admin.getEmail()));
    }

    // ── Applications ─────────────────────────────────────────────────────────
    @Operation(summary = "Get All Applications", description = "Returns all job applications across all companies and students. ADMIN role required.")
    @GetMapping("/applications")
    public ResponseEntity<List<Map<String, Object>>> getAllApplications(HttpServletRequest req) {
        checkAdmin(req);
        return ResponseEntity.ok(adminService.getAllApplications());
    }

    // ── Notifications / Broadcast ─────────────────────────────────────────────
    @Operation(summary = "Broadcast Notification", description = "Send a notification message to all users or a specific role (STUDENT / COMPANY / ALL). ADMIN role required.")
    @PostMapping("/broadcast")
    public ResponseEntity<String> broadcast(@RequestBody Map<String, String> body,
                                            HttpServletRequest req) {
        User admin = checkAdmin(req);
        String message    = body.get("message");
        String targetRole = body.getOrDefault("targetRole", "ALL");
        return ResponseEntity.ok(adminService.broadcast(message, targetRole, admin.getEmail()));
    }

    // ── Audit Logs ────────────────────────────────────────────────────────────
    @Operation(summary = "Get Audit Logs", description = "Returns the full admin audit trail — all admin actions (user blocks, company approvals, job deletions, etc.). ADMIN role required.")
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs(HttpServletRequest req) {
        checkAdmin(req);
        return ResponseEntity.ok(adminService.getAuditLogs());
    }

    // ── Platform Stats ────────────────────────────────────────────────────────
    @Operation(summary = "Get Platform Statistics", description = "Returns platform-wide stats: total users, companies, students, jobs posted, applications submitted, and placement rate. ADMIN role required.")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(HttpServletRequest req) {
        checkAdmin(req);
        return ResponseEntity.ok(adminService.getPlatformStats());
    }
}
