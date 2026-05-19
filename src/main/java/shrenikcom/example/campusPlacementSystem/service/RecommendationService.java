package shrenikcom.example.campusPlacementSystem.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import shrenikcom.example.campusPlacementSystem.entity.*;
import shrenikcom.example.campusPlacementSystem.repository.ApplicationRepository;
import shrenikcom.example.campusPlacementSystem.repository.JobRepository;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    // ── Scoring weights ───────────────────────────────────────────────────────
    private static final double SKILL_WEIGHT     = 3.0;
    private static final double TITLE_WEIGHT     = 2.0;
    private static final double DESC_WEIGHT      = 1.0;
    private static final double RECENCY_BONUS    = 1.5;
    private static final double EXP_BOOST        = 1.2;
    private static final double EXP_PENALTY      = 0.7;

    private static final Set<String> SENIOR_WORDS = Set.of("senior", "lead", "principal", "staff", "architect", "manager");
    private static final Set<String> JUNIOR_WORDS = Set.of("junior", "intern", "fresher", "entry", "trainee", "graduate");

    /**
     * Returns up to 10 recommended OPEN jobs for the given student,
     * scored by a TF-IDF-inspired algorithm with experience-level boost and recency bonus.
     */
    public List<Map<String, Object>> getRecommendations(User student) {

        // ── 1. Build student keyword vectors ─────────────────────────────────
        Set<String> skillKeywords = new LinkedHashSet<>();
        Set<String> titleKeywords = new LinkedHashSet<>();

        if (student.getSkills() != null && !student.getSkills().isBlank()) {
            Arrays.stream(student.getSkills().split(","))
                    .map(String::trim).map(String::toLowerCase)
                    .filter(s -> !s.isEmpty())
                    .forEach(skillKeywords::add);
        }

        List<Application> pastApps = applicationRepository.findByStudent(student);

        boolean studentIsJunior = false;
        boolean studentIsSenior = false;
        for (Application app : pastApps) {
            String t = app.getJob().getTitle().toLowerCase();
            if (JUNIOR_WORDS.stream().anyMatch(t::contains)) studentIsJunior = true;
            if (SENIOR_WORDS.stream().anyMatch(t::contains)) studentIsSenior = true;
            Arrays.stream(t.split("\\s+"))
                    .map(String::trim).filter(s -> s.length() > 2)
                    .filter(s -> !SENIOR_WORDS.contains(s) && !JUNIOR_WORDS.contains(s))
                    .forEach(titleKeywords::add);
        }

        Set<String> allKeywords = new LinkedHashSet<>();
        allKeywords.addAll(skillKeywords);
        allKeywords.addAll(titleKeywords);

        Set<Long> appliedIds = pastApps.stream()
                .map(a -> a.getJob().getId()).collect(Collectors.toSet());

        // ── 2. Candidate jobs ─────────────────────────────────────────────────
        List<Job> openJobs = jobRepository.findAll().stream()
                .filter(j -> j.getStatus() == JobStatus.OPEN)
                .filter(j -> !appliedIds.contains(j.getId()))
                .collect(Collectors.toList());

        if (openJobs.isEmpty()) return Collections.emptyList();

        // ── 3. Build IDF map (term → document frequency across all open jobs) ─
        int N = openJobs.size();
        Map<String, Integer> df = new HashMap<>();
        for (Job job : openJobs) {
            String hay = (job.getTitle() + " " + safeDesc(job)).toLowerCase();
            for (String kw : allKeywords) {
                if (hay.contains(kw)) df.merge(kw, 1, Integer::sum);
            }
        }

        // ── 4. Score each job ─────────────────────────────────────────────────
        List<Map<String, Object>> scored = new ArrayList<>();

        for (Job job : openJobs) {
            String titleHay = job.getTitle().toLowerCase();
            String descHay  = safeDesc(job).toLowerCase();
            String fullHay  = titleHay + " " + descHay;

            double rawScore = 0.0;
            List<String> matchedSkills = new ArrayList<>();
            int matchedCount = 0;

            for (String skill : skillKeywords) {
                if (fullHay.contains(skill)) {
                    double idf = Math.log(1.0 + (double) N / (1.0 + df.getOrDefault(skill, 1)));
                    rawScore += SKILL_WEIGHT * (1.0 + idf);
                    matchedSkills.add(skill);
                    matchedCount++;
                }
            }

            for (String word : titleKeywords) {
                if (fullHay.contains(word)) {
                    double idf = Math.log(1.0 + (double) N / (1.0 + df.getOrDefault(word, 1)));
                    rawScore += TITLE_WEIGHT * (1.0 + idf * 0.5);
                    matchedCount++;
                }
            }

            for (String kw : allKeywords) {
                if (descHay.contains(kw) && !titleHay.contains(kw)) {
                    rawScore += DESC_WEIGHT;
                }
            }

            if (rawScore == 0.0) continue;

            // Experience-level modifier
            boolean jobIsSenior = SENIOR_WORDS.stream().anyMatch(titleHay::contains);
            boolean jobIsJunior = JUNIOR_WORDS.stream().anyMatch(titleHay::contains);
            boolean expMatch = false;

            if      (jobIsSenior && studentIsSenior) { rawScore *= EXP_BOOST;   expMatch = true; }
            else if (jobIsJunior && studentIsJunior) { rawScore *= EXP_BOOST;   expMatch = true; }
            else if (jobIsSenior && studentIsJunior) { rawScore *= EXP_PENALTY; }
            else if (!jobIsSenior && !jobIsJunior)   { expMatch = true; }

            // Recency bonus
            boolean isRecent = false;
            if (job.getCreatedAt() != null) {
                long daysOld = ChronoUnit.DAYS.between(job.getCreatedAt(), LocalDateTime.now());
                if (daysOld <= 7) { rawScore += RECENCY_BONUS; isRecent = true; }
            }

            int matchPct = allKeywords.isEmpty() ? 0
                    : Math.min(100, (int) Math.round((double) matchedCount / allKeywords.size() * 100));

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id",              job.getId());
            entry.put("title",           job.getTitle());
            entry.put("description",     job.getDescription());
            entry.put("companyName",     job.getCompany() != null ? job.getCompany().getName() : "—");
            entry.put("score",           (int) Math.round(rawScore));
            entry.put("matchPercentage", matchPct);
            entry.put("matchedSkills",   matchedSkills);
            entry.put("similarityScore", Math.round(rawScore * 10.0) / 10.0);
            entry.put("experienceMatch", expMatch);
            entry.put("isRecent",        isRecent);
            entry.put("createdAt",       job.getCreatedAt());
            scored.add(entry);
        }

        // ── 5. Sort by similarityScore desc, top 10 ──────────────────────────
        scored.sort((a, b) -> Double.compare(
                ((Number) b.get("similarityScore")).doubleValue(),
                ((Number) a.get("similarityScore")).doubleValue()
        ));

        return scored.stream().limit(10).collect(Collectors.toList());
    }

    private String safeDesc(Job job) {
        return job.getDescription() != null ? job.getDescription() : "";
    }
}

