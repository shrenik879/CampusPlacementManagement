package shrenikcom.example.campusPlacementSystem.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import shrenikcom.example.campusPlacementSystem.dto.JobRequest;
import shrenikcom.example.campusPlacementSystem.entity.Job;
import shrenikcom.example.campusPlacementSystem.entity.JobStatus;
import shrenikcom.example.campusPlacementSystem.entity.Role;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.repository.JobRepository;
import shrenikcom.example.campusPlacementSystem.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Job service with Redis cache eviction.
 *
 * Cache strategy (why Page<Job> is NOT cached here)
 * ──────────────────────────────────────────────────
 *  • Job is a JPA entity with a @ManyToOne(fetch=LAZY) relation to User.
 *    Caching a Page<Job> with the JDK serializer would throw
 *    SerializationException because Hibernate lazy proxies are not serializable.
 *  • The analytics / platformStats caches (plain Map<String,Object>) ARE
 *    safely cached and gain real performance benefit on the dashboard.
 *
 * Eviction: when a job is created, closed, or deleted the analytics and
 * platformStats caches are evicted so they are re-computed on the next request.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository     jobRepository;
    private final UserRepository    userRepository;
    private final EmailService      emailService;
    private final NotificationService notificationService;

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * Searches / paginates jobs.
     * NOT cached (Page<Job> contains JPA lazy proxies — not JDK-serializable).
     * The DB query is fast (indexed on status + company_id).
     */
    public Page<Job> searchJobs(String title, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        if (title != null && status != null) {
            JobStatus jobStatus = JobStatus.valueOf(status.toUpperCase());
            return jobRepository.findByTitleContainingIgnoreCaseAndStatus(title, jobStatus, pageable);
        }
        if (title != null) {
            return jobRepository.findByTitleContainingIgnoreCase(title, pageable);
        }
        if (status != null) {
            JobStatus jobStatus = JobStatus.valueOf(status.toUpperCase());
            return jobRepository.findByStatus(jobStatus, pageable);
        }
        return jobRepository.findAll(pageable);
    }

    // ── Write (evict analytics/stats) ─────────────────────────────────────────

    /**
     * Creates a job.
     * Evicts analytics + platformStats because company job totals shift.
     */
    @Caching(evict = {
            @CacheEvict(value = "analytics",     allEntries = true),
            @CacheEvict(value = "platformStats", allEntries = true)
    })
    public Job postJob(JobRequest request, User company) {
        log.debug("[JobService] postJob — evicting analytics/platformStats caches");

        String roundsStr = null;
        if (request.getRounds() != null && !request.getRounds().isEmpty()) {
            roundsStr = String.join(",", request.getRounds());
        }

        Job job = Job.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .company(company)
                .status(JobStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .rounds(roundsStr)
                .build();
        return jobRepository.save(job);
    }

    /**
     * Posts a job and notifies all students.
     * Delegates to postJob() which carries the eviction annotations.
     */
    public Job postJobWithNotification(JobRequest request, User company) {
        Job job = postJob(request, company);

        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.STUDENT)
                .collect(Collectors.toList());

        List<String> studentEmails = students.stream()
                .map(User::getEmail)
                .collect(Collectors.toList());

        if (!studentEmails.isEmpty()) {
            emailService.sendNewJobNotification(studentEmails, job.getTitle(), company.getName());
        }

        List<Long> studentIds = students.stream()
                .map(User::getId)
                .collect(Collectors.toList());

        notificationService.pushNewJobToStudents(studentIds, job.getTitle(), company.getName());
        return job;
    }

    /**
     * Closes a job.
     * Evicts analytics because status change affects conversion rates.
     */
    @Caching(evict = {
            @CacheEvict(value = "analytics",     allEntries = true),
            @CacheEvict(value = "platformStats", allEntries = true)
    })
    public Job closeJob(Long jobId, Long companyId) {
        log.debug("[JobService] closeJob id={} — evicting analytics/platformStats caches", jobId);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        if (!job.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("Not authorized to close this job");
        }
        job.setStatus(JobStatus.CLOSED);
        return jobRepository.save(job);
    }
}
