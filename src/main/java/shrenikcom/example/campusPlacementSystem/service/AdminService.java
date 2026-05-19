package shrenikcom.example.campusPlacementSystem.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import shrenikcom.example.campusPlacementSystem.dto.UserResponse;
import shrenikcom.example.campusPlacementSystem.entity.*;
import shrenikcom.example.campusPlacementSystem.repository.*;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository        userRepository;
    private final JobRepository         jobRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditLogRepository    auditLogRepository;
    private final NotificationService   notificationService;

    // ── Audit helper ─────────────────────────────────────────────────────────
    private void log(String action, String adminEmail, String targetName, String details) {
        auditLogRepository.save(AuditLog.builder()
                .action(action)
                .adminEmail(adminEmail)
                .targetName(targetName)
                .details(details)
                .build());
    }

    // ── Approve company ───────────────────────────────────────────────────────
    public String approveCompany(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.COMPANY) throw new RuntimeException("Not a company");
        user.setApproved(true);
        userRepository.save(user);
        log("COMPANY_APPROVED", adminEmail, user.getName(), "Company account activated");
        return "Company approved";
    }

    // ── Reject / revoke company approval ─────────────────────────────────────
    public String rejectCompany(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.COMPANY) throw new RuntimeException("Not a company");
        user.setApproved(false);
        userRepository.save(user);
        log("COMPANY_REJECTED", adminEmail, user.getName(), "Company approval revoked");
        return "Company rejected";
    }

    // ── Block user ────────────────────────────────────────────────────────────
    public String blockUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBlocked(true);
        userRepository.save(user);
        log("USER_BLOCKED", adminEmail, user.getName(), "User blocked: " + user.getEmail());
        return "User blocked";
    }

    // ── Unblock user ──────────────────────────────────────────────────────────
    public String unblockUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBlocked(false);
        userRepository.save(user);
        log("USER_UNBLOCKED", adminEmail, user.getName(), "User unblocked: " + user.getEmail());
        return "User unblocked";
    }

    // ── Get all users paged ───────────────────────────────────────────────────
    public Page<UserResponse> getAllUsers(int page, int size) {
        PageRequest pr = PageRequest.of(page, size, Sort.by("id").descending());
        Page<User> userPage = userRepository.findAll(pr);
        List<UserResponse> content = userPage.getContent().stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .resumeUrl(user.getResumeUrl())
                        .approved(user.getApproved())
                        .blocked(Boolean.TRUE.equals(user.getBlocked()))
                        .build())
                .collect(Collectors.toList());
        return new PageImpl<>(content, pr, userPage.getTotalElements());
    }

    // ── Delete user ───────────────────────────────────────────────────────────
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "platformStats", allEntries = true),
            @CacheEvict(value = "analytics",     allEntries = true)
    })
    public String deleteUser(Long id, String adminEmail) {
        log.debug("[AdminService] deleteUser id={} — evicting platformStats/analytics caches", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == Role.COMPANY) {
            List<Job> companyJobs = jobRepository.findByCompany(user);
            for (Job job : companyJobs) applicationRepository.deleteByJob(job);
            jobRepository.deleteAll(companyJobs);
        } else {
            applicationRepository.deleteByStudent(user);
        }
        String name = user.getName();
        userRepository.deleteById(id);
        log("USER_DELETED", adminEmail, name, "Role: " + user.getRole());
        return "User deleted";
    }

    // ── Get all jobs paged ────────────────────────────────────────────────────
    // NOT cached: Page<Job> contains Hibernate lazy proxies — not JDK-serializable.
    public Page<Job> getAllJobs(int page, int size) {
        PageRequest pr = PageRequest.of(page, size, Sort.by("id").descending());
        return jobRepository.findAll(pr);
    }

    // ── Delete job ────────────────────────────────────────────────────────────
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "analytics",     allEntries = true),
            @CacheEvict(value = "platformStats", allEntries = true)
    })
    public String deleteJob(Long id, String adminEmail) {
        log.debug("[AdminService] deleteJob id={} — evicting analytics/platformStats caches", id);
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        applicationRepository.deleteByJob(job);
        String title = job.getTitle();
        jobRepository.deleteById(id);
        log("JOB_DELETED", adminEmail, title, "Company: " + job.getCompany().getName());
        return "Job deleted";
    }

    // ── Update job status ─────────────────────────────────────────────────────
    @CacheEvict(value = "analytics", allEntries = true)
    public String updateJobStatus(Long id, String status, String adminEmail) {
        log.debug("[AdminService] updateJobStatus id={} status={} — evicting analytics cache", id, status);
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        job.setStatus(JobStatus.valueOf(status));
        jobRepository.save(job);
        log("JOB_STATUS_UPDATED", adminEmail, job.getTitle(), "New status: " + status);
        return "Job status updated";
    }

    // ── Flag / unflag job ─────────────────────────────────────────────────────
    public String toggleJobFlag(Long id, String adminEmail) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        boolean nowFlagged = !Boolean.TRUE.equals(job.getFlagged());
        job.setFlagged(nowFlagged);
        jobRepository.save(job);
        String action = nowFlagged ? "JOB_FLAGGED" : "JOB_UNFLAGGED";
        log(action, adminEmail, job.getTitle(), "Flagged: " + nowFlagged);
        return nowFlagged ? "Job flagged" : "Job unflagged";
    }

    // ── Application oversight ─────────────────────────────────────────────────
    public List<Map<String, Object>> getAllApplications() {
        return applicationRepository.findAll().stream().map(app -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",         app.getId());
            m.put("studentName", app.getStudent().getName());
            m.put("studentEmail", app.getStudent().getEmail());
            m.put("jobTitle",   app.getJob().getTitle());
            m.put("company",    app.getJob().getCompany().getName());
            m.put("status",     app.getStatus().name());
            return m;
        }).collect(Collectors.toList());
    }

    // ── Broadcast notification ────────────────────────────────────────────────
    public String broadcast(String message, String targetRole, String adminEmail) {
        List<User> recipients = userRepository.findAll().stream()
                .filter(u -> targetRole == null || targetRole.equals("ALL") || u.getRole().name().equals(targetRole))
                .collect(Collectors.toList());

        for (User u : recipients) {
            notificationService.pushBroadcast(u.getId(), message);
        }
        log("BROADCAST_SENT", adminEmail, "Target: " + (targetRole == null ? "ALL" : targetRole),
                "Message: " + message + " | Recipients: " + recipients.size());
        return "Notification sent to " + recipients.size() + " users";
    }

    // ── Audit logs ────────────────────────────────────────────────────────────
    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    // ── Platform stats ────────────────────────────────────────────────────────
    /**
     * Cached: aggregates 5 count queries — cheap but called on every admin
     * dashboard open.  Single static key because stats are global (not per-user).
     * TTL: 10 min (inherits global RedisConfig default).
     */
    @Cacheable(value = "platformStats", key = "'global'")
    public Map<String, Object> getPlatformStats() {
        log.debug("[AdminService] getPlatformStats — DB query");
        long students   = userRepository.countByRole(Role.STUDENT);
        long companies  = userRepository.countByRole(Role.COMPANY);
        long totalUsers = userRepository.count();
        long jobs       = jobRepository.count();
        long apps       = applicationRepository.count();
        long pendingApprovals = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.COMPANY && !Boolean.TRUE.equals(u.getApproved())).count();
        long blockedUsers = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getBlocked())).count();
        long flaggedJobs = jobRepository.findAll().stream()
                .filter(j -> Boolean.TRUE.equals(j.getFlagged())).count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers",       totalUsers);
        stats.put("students",         students);
        stats.put("companies",        companies);
        stats.put("jobs",             jobs);
        stats.put("applications",     apps);
        stats.put("pendingApprovals", pendingApprovals);
        stats.put("blockedUsers",     blockedUsers);
        stats.put("flaggedJobs",      flaggedJobs);
        return stats;
    }
}
