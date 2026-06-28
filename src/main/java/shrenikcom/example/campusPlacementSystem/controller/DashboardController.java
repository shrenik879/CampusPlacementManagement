package shrenikcom.example.campusPlacementSystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import shrenikcom.example.campusPlacementSystem.entity.ApplicationStatus;
import shrenikcom.example.campusPlacementSystem.entity.Role;
import shrenikcom.example.campusPlacementSystem.repository.ApplicationRepository;
import shrenikcom.example.campusPlacementSystem.repository.JobRepository;
import shrenikcom.example.campusPlacementSystem.repository.UserRepository;

import java.util.Map;

/**
 * Public endpoint — no JWT required.
 * GET /api/dashboard/stats → { companies, students, jobs, placements }
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Public statistics endpoint. No authentication required.")
public class DashboardController {

    private final UserRepository        userRepository;
    private final JobRepository         jobRepository;
    private final ApplicationRepository applicationRepository;

    @Operation(summary = "Get Platform Stats", description = "Returns counts of companies, students, jobs, and placements. Public endpoint.")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        long companies  = userRepository.countByRole(Role.COMPANY);
        long students   = userRepository.countByRole(Role.STUDENT);
        long jobs       = jobRepository.count();
        long placements = applicationRepository.countByStatus(ApplicationStatus.SELECTED);

        return ResponseEntity.ok(Map.of(
                "companies",  companies,
                "students",   students,
                "jobs",       jobs,
                "placements", placements
        ));
    }
}
