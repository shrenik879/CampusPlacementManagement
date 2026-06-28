package shrenikcom.example.campusPlacementSystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import shrenikcom.example.campusPlacementSystem.dto.JobRequest;
import shrenikcom.example.campusPlacementSystem.entity.Job;
import shrenikcom.example.campusPlacementSystem.entity.Role;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.service.JobService;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Job listings: search jobs (public), post jobs (COMPANY), close jobs (COMPANY).")
@SecurityRequirement(name = "BearerAuth")
public class JobController {

    private final JobService jobService;

    @Operation(summary = "Search Jobs", description = "Search open jobs by title or status with pagination. Requires authentication.")
    // GET /api/jobs?title=&status=&page=0&size=5
    @GetMapping
    public ResponseEntity<Page<Job>> getJobs(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        Page<Job> jobs = jobService.searchJobs(title, status, page, size);
        return ResponseEntity.ok(jobs);
    }

    @Operation(summary = "Post Job", description = "Create a new job listing. COMPANY role required.")
    // POST /api/jobs  (COMPANY only)
    @PostMapping
    public ResponseEntity<Job> postJob(@RequestBody JobRequest request,
                                       HttpServletRequest httpRequest) {
        User user = (User) httpRequest.getAttribute("user");
        if (user == null || user.getRole() != Role.COMPANY) {
            throw new RuntimeException("Only approved companies can post jobs");
        }
        Job job = jobService.postJobWithNotification(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(job);
    }

    @Operation(summary = "Close Job", description = "Close a job listing. COMPANY role required. Only the owning company can close their job.")
    // PUT /api/jobs/{id}/close  (COMPANY only)
    @PutMapping("/{id}/close")
    public ResponseEntity<Job> closeJob(@PathVariable Long id, HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        if (user == null || user.getRole() != Role.COMPANY) {
            throw new RuntimeException("Only companies can close jobs");
        }
        Job job = jobService.closeJob(id, user.getId());
        return ResponseEntity.ok(job);
    }
}
