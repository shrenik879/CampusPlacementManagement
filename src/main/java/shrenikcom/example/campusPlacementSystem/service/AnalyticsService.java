package shrenikcom.example.campusPlacementSystem.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import shrenikcom.example.campusPlacementSystem.entity.*;
import shrenikcom.example.campusPlacementSystem.repository.ApplicationRepository;
import shrenikcom.example.campusPlacementSystem.repository.JobRepository;
import shrenikcom.example.campusPlacementSystem.repository.RoundRepository;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Computes per-job and aggregate analytics for a company.
 * No schema changes — all metrics are derived from existing tables.
 */
/**
 * Analytics service with Redis caching.
 *
 * Cache strategy
 * ──────────────
 *  • getCompanyAnalytics() → @Cacheable("analytics") keyed by company.id
 *    Rationale: analytics queries aggregate across Jobs + Applications + Rounds
 *    (potentially hundreds of rows) — the most expensive read in the system.
 *    Caching eliminates these heavy joins on every dashboard reload.
 *
 * Eviction: handled externally by JobService and AdminService when jobs or
 * applications are mutated, keeping the cache consistent without polling.
 *
 * TTL: 10 minutes (configured globally in RedisConfig).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final RoundRepository roundRepository;

    /**
     * Returns full analytics for the authenticated company user:
     * - Summary (total applicants, selected, conversion rate)
     * - Per-job breakdown with funnel stages and per-round conversion
     */
    /**
     * Returns full analytics for the authenticated company.
     * Result is cached in Redis under key = company.id so each company
     * gets its own isolated cache entry.
     */
    @Cacheable(value = "analytics", key = "#company.id")
    public Map<String, Object> getCompanyAnalytics(User company) {
        log.debug("[AnalyticsService] getCompanyAnalytics — DB query for companyId={}", company.getId());

        List<Job> jobs = jobRepository.findByCompany(company);
        List<Application> allApplications = applicationRepository.findByJob_Company(company);

        // ── Aggregate summary ─────────────────────────────────────────────────
        long totalApplicants = allApplications.size();
        long totalSelected   = allApplications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.SELECTED
                          || a.getStatus() == ApplicationStatus.IN_PROGRESS)
                .count();
        long totalRejected   = allApplications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();
        double overallConversion = totalApplicants == 0 ? 0.0
                : Math.round((double) totalSelected / totalApplicants * 1000.0) / 10.0;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalJobs",        jobs.size());
        summary.put("totalApplicants",  totalApplicants);
        summary.put("totalSelected",    totalSelected);
        summary.put("totalRejected",    totalRejected);
        summary.put("totalPending",     totalApplicants - totalSelected - totalRejected);
        summary.put("conversionRate",   overallConversion);

        // ── Per-job breakdown ─────────────────────────────────────────────────
        List<Map<String, Object>> jobAnalytics = new ArrayList<>();

        for (Job job : jobs) {
            List<Application> apps = applicationRepository.findByJob(job);
            if (apps.isEmpty()) continue;

            long jobTotal     = apps.size();
            long jobSelected  = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.SELECTED
                    || a.getStatus() == ApplicationStatus.IN_PROGRESS).count();
            long jobRejected  = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();
            long jobPending   = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING).count();
            long jobInProgress = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.IN_PROGRESS).count();

            double jobConversion = jobTotal == 0 ? 0.0
                    : Math.round((double) jobSelected / jobTotal * 1000.0) / 10.0;

            // Funnel stages: Applied → Shortlisted (not pending) → Selected
            long shortlisted = jobTotal - jobPending;
            List<Map<String, Object>> funnel = List.of(
                    Map.of("stage", "Applied",     "count", jobTotal,    "percentage", 100),
                    Map.of("stage", "Shortlisted", "count", shortlisted,
                           "percentage", jobTotal == 0 ? 0 : (int) Math.round((double) shortlisted / jobTotal * 100)),
                    Map.of("stage", "Selected",    "count", jobSelected,
                           "percentage", jobTotal == 0 ? 0 : (int) Math.round((double) jobSelected / jobTotal * 100))
            );

            // Per-round conversion
            List<Map<String, Object>> roundStats = new ArrayList<>();
            if (job.getRounds() != null && !job.getRounds().isBlank()) {
                String[] roundNames = job.getRounds().split(",");
                for (String roundName : roundNames) {
                    String name = roundName.trim();
                    List<Round> roundEntries = new ArrayList<>();
                    for (Application app : apps) {
                        List<Round> appRounds = roundRepository.findByApplicationOrderByRoundOrderAsc(app);
                        appRounds.stream()
                                .filter(r -> r.getRoundName().equalsIgnoreCase(name))
                                .forEach(roundEntries::add);
                    }
                    long passed = roundEntries.stream().filter(r -> r.getStatus() == RoundStatus.PASSED).count();
                    long failed = roundEntries.stream().filter(r -> r.getStatus() == RoundStatus.FAILED).count();
                    long pending = roundEntries.stream().filter(r -> r.getStatus() == RoundStatus.PENDING).count();
                    long total   = roundEntries.size();

                    Map<String, Object> rs = new LinkedHashMap<>();
                    rs.put("roundName",   name);
                    rs.put("total",       total);
                    rs.put("passed",      passed);
                    rs.put("failed",      failed);
                    rs.put("pending",     pending);
                    rs.put("passRate",    total == 0 ? 0 : Math.round((double) passed / total * 1000.0) / 10.0);
                    roundStats.add(rs);
                }
            }

            Map<String, Object> jobEntry = new LinkedHashMap<>();
            jobEntry.put("jobId",          job.getId());
            jobEntry.put("jobTitle",        job.getTitle());
            jobEntry.put("status",          job.getStatus());
            jobEntry.put("totalApplicants", jobTotal);
            jobEntry.put("selected",        jobSelected);
            jobEntry.put("rejected",        jobRejected);
            jobEntry.put("pending",         jobPending);
            jobEntry.put("inProgress",      jobInProgress);
            jobEntry.put("conversionRate",  jobConversion);
            jobEntry.put("funnelStages",    funnel);
            jobEntry.put("roundStats",      roundStats);
            jobAnalytics.add(jobEntry);
        }

        // Sort by totalApplicants desc
        jobAnalytics.sort((a, b) ->
                Long.compare((long) b.get("totalApplicants"), (long) a.get("totalApplicants")));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary", summary);
        result.put("jobs",    jobAnalytics);
        return result;
    }
}
