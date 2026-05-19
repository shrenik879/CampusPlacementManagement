package shrenikcom.example.campusPlacementSystem.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import shrenikcom.example.campusPlacementSystem.dto.ProfileResponse;
import shrenikcom.example.campusPlacementSystem.dto.UpdateProfileRequest;
import shrenikcom.example.campusPlacementSystem.entity.*;
import shrenikcom.example.campusPlacementSystem.repository.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;

    // ── GET profile ───────────────────────────────────────────────────────────
    public ProfileResponse getProfile(User user) {
        Map<String, Object> stats = buildStats(user);
        return ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .skills(user.getSkills())
                .resumeUrl(user.getResumeUrl())
                .approved(Boolean.TRUE.equals(user.getApproved()))
                .stats(stats)
                .build();
    }

    // ── UPDATE profile ────────────────────────────────────────────────────────
    public ProfileResponse updateProfile(User user, UpdateProfileRequest req) {
        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName().trim());
        }
        // Skills update (students only, but allow for any role to be safe)
        if (req.getSkills() != null) {
            user.setSkills(req.getSkills().trim());
        }
        userRepository.save(user);
        return getProfile(user);
    }

    // ── Role-based stats ──────────────────────────────────────────────────────
    private Map<String, Object> buildStats(User user) {
        Map<String, Object> stats = new LinkedHashMap<>();

        switch (user.getRole()) {

            case STUDENT -> {
                List<Application> apps = applicationRepository.findByStudent(user);
                long selected   = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.SELECTED).count();
                long rejected   = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();
                long pending    = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING).count();
                long inProgress = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.IN_PROGRESS).count();
                int  skillCount = user.getSkills() != null
                        ? (int) java.util.Arrays.stream(user.getSkills().split(","))
                              .map(String::trim).filter(s -> !s.isEmpty()).count()
                        : 0;
                stats.put("totalApplications", apps.size());
                stats.put("selected",          selected);
                stats.put("rejected",           rejected);
                stats.put("pending",            pending);
                stats.put("inProgress",         inProgress);
                stats.put("hasResume",          user.getResumeUrl() != null && !user.getResumeUrl().isBlank());
                stats.put("skillCount",         skillCount);
            }

            case COMPANY -> {
                List<Job> jobs = jobRepository.findByCompany(user);
                long activeJobs = jobs.stream().filter(j -> j.getStatus() == JobStatus.OPEN).count();
                List<Application> allApps = applicationRepository.findByJob_Company(user);
                long totalApplicants = allApps.size();
                long selectedApplicants = allApps.stream()
                        .filter(a -> a.getStatus() == ApplicationStatus.SELECTED).count();
                stats.put("totalJobsPosted",    jobs.size());
                stats.put("activeJobs",          activeJobs);
                stats.put("totalApplicants",     totalApplicants);
                stats.put("selectedApplicants",  selectedApplicants);
                stats.put("conversionRate",      totalApplicants == 0 ? 0.0
                        : Math.round((double) selectedApplicants / totalApplicants * 1000.0) / 10.0);
            }

            case ADMIN -> {
                long totalUsers     = userRepository.count();
                long totalCompanies = userRepository.countByRole(Role.COMPANY);
                long totalStudents  = userRepository.countByRole(Role.STUDENT);
                stats.put("totalUsers",     totalUsers);
                stats.put("totalCompanies", totalCompanies);
                stats.put("totalStudents",  totalStudents);
            }
        }
        return stats;
    }
}
