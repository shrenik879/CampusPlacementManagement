package shrenikcom.example.campusPlacementSystem.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import shrenikcom.example.campusPlacementSystem.entity.*;
import shrenikcom.example.campusPlacementSystem.repository.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * ChatService — Intent detection + data fetch + Gemini API call.
 *
 * Flow:
 *   1. Detect intent from user message (keyword matching).
 *   2. Fetch relevant data from the DB using existing repos.
 *   3. Build a context string and send to Gemini for a natural language reply.
 *   4. Return Gemini's response.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final ApplicationRepository applicationRepository;
    private final JobRepository         jobRepository;
    private final UserRepository        userRepository;

    // Tried in order — first one available for this API key wins
    private static final String[] CANDIDATE_MODELS = {
        "gemini-2.5-flash-preview-04-17",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-pro",
    };

    /** Resolved at startup by probing ListModels; used for all generateContent calls. */
    private String geminiGenerateUrl;

    // (cache and cooldown removed — every request goes directly to Gemini)

    @jakarta.annotation.PostConstruct
    public void discoverGeminiModel() {
        RestTemplate rest = new RestTemplate();
        String listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + geminiApiKey;
        try {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> body =
                rest.getForObject(listUrl, java.util.Map.class);
            if (body != null && body.containsKey("models")) {
                @SuppressWarnings("unchecked")
                java.util.List<java.util.Map<String, Object>> models =
                    (java.util.List<java.util.Map<String, Object>>) body.get("models");
                java.util.Set<String> available = new java.util.HashSet<>();
                for (var m : models) {
                    String name = (String) m.get("name"); // e.g. "models/gemini-1.5-flash"
                    if (name != null) available.add(name.replace("models/", ""));
                }
                log.info("Gemini models available for this key: {}", available);
                for (String candidate : CANDIDATE_MODELS) {
                    if (available.contains(candidate)) {
                        geminiGenerateUrl = "https://generativelanguage.googleapis.com/v1beta/models/"
                                + candidate + ":generateContent?key=" + geminiApiKey;
                        log.info("PlacementBot will use Gemini model: {}", candidate);
                        return;
                    }
                }
                log.warn("None of the candidate models found. Available: {}", available);
            }
        } catch (Exception e) {
            log.warn("Could not auto-discover Gemini model: {}", e.getMessage());
        }
        // Hard fallback — use the most reliable free-tier model
        geminiGenerateUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiApiKey;
        log.warn("Using default fallback model: gemini-2.0-flash");
    }

    // ── Public entry point ──────────────────────────────────────────────────

    public String chat(String userMessage, User currentUser) {
        String msg = userMessage.toLowerCase().trim();

        // ── 1. Direct / rule-based answer (no Gemini call) ────────────────────
        String directReply = tryDirectAnswer(msg, currentUser);
        if (directReply != null) {
            return directReply;
        }

        // ── 2. Build context and call Gemini ──────────────────────────────────
        String context;
        try {
            context = buildContext(msg, currentUser);
        } catch (Exception e) {
            log.warn("Context build failed: {}", e.getMessage());
            context = "The user is a " + currentUser.getRole() + " named " + currentUser.getName()
                    + " in a Campus Placement System.";
        }

        return callGemini(userMessage, context, currentUser);
    }

    // ── Direct rule-based answers (no Gemini) ───────────────────────────────
    // Returns null if the question is open-ended and Gemini should handle it.

    private String tryDirectAnswer(String msg, User user) {
        Role role = user.getRole();

        // ── Student queries ──
        if (role == Role.STUDENT) {
            List<Application> apps = applicationRepository.findByStudentId(user.getId());

            // Only trigger for very specific self-status questions, NOT analytical questions
            boolean isMyStatusQuery = containsAny(msg,
                "am i selected", "did i get selected", "got selected", "my application status",
                "my status", "show my applications", "my applications", "how many applications");

            if (isMyStatusQuery) {
                if (apps.isEmpty()) return "📋 You haven't applied to any jobs yet.";
                long sel  = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.SELECTED).count();
                long rej  = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();
                long pend = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING).count();
                if (sel > 0)
                    return "🎉 Yes! You're selected in " + sel + " job(s) out of " + apps.size() + " applications. " + pend + " still pending, " + rej + " rejected.";
                else
                    return "⏳ Not selected yet. You have " + pend + " pending and " + rej + " rejected out of " + apps.size() + " applications.";
            }

            // Only show generic job list if the message is purely "show jobs" type
            boolean isListJobsQuery = containsAny(msg,
                "show jobs", "list jobs", "open jobs", "available jobs", "all jobs", "what jobs");

            if (isListJobsQuery) {
                List<Job> openJobs = jobRepository.findByStatus(JobStatus.OPEN);
                if (openJobs.isEmpty()) return "🔍 No open jobs right now. Check back later!";
                return "💼 There are " + openJobs.size() + " open job(s) available. Visit the Jobs page to apply!";
            }
        }

        // ── Company queries ──
        if (role == Role.COMPANY) {
            if (containsAny(msg, "applicant", "candidate", "who applied", "application")) {
                List<Job> myJobs = jobRepository.findByCompanyId(user.getId());
                List<Application> allApps = new ArrayList<>();
                for (Job job : myJobs) allApps.addAll(applicationRepository.findByJobId(job.getId()));
                if (allApps.isEmpty()) return "📋 No applicants yet for your postings.";
                long sel  = allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.SELECTED).count();
                long pend = allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING).count();
                return "👥 You have " + allApps.size() + " applicant(s) — " + sel + " selected, " + pend + " pending.";
            }
            if (containsAny(msg, "job", "posting", "my job")) {
                List<Job> myJobs = jobRepository.findByCompanyId(user.getId());
                if (myJobs.isEmpty()) return "📋 You have no job postings yet.";
                long open = myJobs.stream().filter(j -> j.getStatus() == JobStatus.OPEN).count();
                return "💼 You have " + myJobs.size() + " job posting(s), " + open + " currently open.";
            }
        }

        // ── Admin queries ──
        if (role == Role.ADMIN) {
            if (containsAny(msg, "stat", "total", "count", "how many", "overview", "summary")) {
                long users    = userRepository.count();
                long students = userRepository.countByRole(Role.STUDENT);
                long companies= userRepository.countByRole(Role.COMPANY);
                long jobs     = jobRepository.count();
                long openJobs = jobRepository.countByStatus(JobStatus.OPEN);
                long apps     = applicationRepository.count();
                return "📊 Platform: " + users + " users (" + students + " students, " + companies + " companies), "
                    + jobs + " jobs (" + openJobs + " open), " + apps + " applications total.";
            }
            if (containsAny(msg, "pending", "approve", "approval")) {
                List<User> pending = userRepository.findByRoleAndApproved(Role.COMPANY, false);
                if (pending.isEmpty()) return "✅ No companies pending approval.";
                return "⏳ " + pending.size() + " company/companies are pending approval. Visit the Admin panel to review.";
            }
        }

        // Not a recognized factual query — let Gemini handle it
        return null;
    }

    // ── Intent detection & context building ────────────────────────────────

    private String buildContext(String msg, User user) {
        Role role = user.getRole();

        if (role == Role.STUDENT) {
            return buildStudentContext(msg, user);
        } else if (role == Role.COMPANY) {
            return buildCompanyContext(msg, user);
        } else if (role == Role.ADMIN) {
            return buildAdminContext(msg, user);
        }
        return "User role: " + role;
    }

    // ── Student contexts ────────────────────────────────────────────────────

    private String buildStudentContext(String msg, User user) {
        StringBuilder ctx = new StringBuilder();
        ctx.append("Student name: ").append(user.getName()).append("\n");
        ctx.append("Student skills: ").append(user.getSkills() != null ? user.getSkills() : "none listed").append("\n");

        // Always fetch ALL applications — so Gemini has full context for any question
        List<Application> apps = applicationRepository.findByStudentId(user.getId());

        ctx.append("All Applications (").append(apps.size()).append(" total):\n");
        apps.forEach(a ->
            ctx.append("  - ").append(a.getJob().getTitle())
               .append(" at ").append(a.getJob().getCompany() != null ? a.getJob().getCompany().getName() : "Unknown")
               .append(" [Status: ").append(a.getStatus()).append("]\n")
        );

        // Always fetch ALL open jobs — so Gemini can answer job-specific questions
        List<Job> openJobs = jobRepository.findByStatus(JobStatus.OPEN);
        ctx.append("All Open Jobs (").append(openJobs.size()).append(" available):\n");
        openJobs.forEach(j ->
            ctx.append("  - ").append(j.getTitle())
               .append(" at ").append(j.getCompany() != null ? j.getCompany().getName() : "Unknown")
               .append(" [").append(j.getStatus()).append("]\n")
        );

        // Summary stats
        long totalApps  = apps.size();
        long selected   = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.SELECTED).count();
        long rejected   = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();
        long pending    = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING).count();
        long inProgress = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.IN_PROGRESS).count();

        ctx.append("Summary: ")
           .append(totalApps).append(" total applications, ")
           .append(selected).append(" selected, ")
           .append(rejected).append(" rejected, ")
           .append(pending).append(" pending, ")
           .append(inProgress).append(" in progress.\n");

        return ctx.toString();
    }

    // ── Company contexts ────────────────────────────────────────────────────

    private String buildCompanyContext(String msg, User user) {
        StringBuilder ctx = new StringBuilder();
        ctx.append("Company recruiter: ").append(user.getName()).append("\n");

        boolean wantsApplicants = containsAny(msg, "applicant", "applied", "candidate", "who applied");
        boolean wantsSelected   = containsAny(msg, "selected", "hired", "accepted");
        boolean wantsJobs       = containsAny(msg, "job", "posting", "open");
        boolean wantsPending    = containsAny(msg, "pending", "review", "waiting");

        List<Job> myJobs = jobRepository.findByCompanyId(user.getId());
        ctx.append("My Job Postings (").append(myJobs.size()).append("):\n");
        myJobs.stream().limit(5).forEach(j ->
            ctx.append("  - ").append(j.getTitle()).append(" [").append(j.getStatus()).append("]\n")
        );

        if (wantsApplicants || wantsSelected || wantsPending) {
            List<Application> allApps = new ArrayList<>();
            for (Job job : myJobs) {
                allApps.addAll(applicationRepository.findByJobId(job.getId()));
            }
            List<Application> filtered = allApps;
            if (wantsSelected) filtered = allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.SELECTED).collect(Collectors.toList());
            if (wantsPending)  filtered = allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING).collect(Collectors.toList());

            ctx.append("Applicants (").append(filtered.size()).append("):\n");
            filtered.stream().limit(10).forEach(a ->
                ctx.append("  - ").append(a.getStudent() != null ? a.getStudent().getName() : "Unknown")
                   .append(" → ").append(a.getJob().getTitle())
                   .append(" [").append(a.getStatus()).append("]\n")
            );

            long totalApps  = allApps.size();
            long selCount   = allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.SELECTED).count();
            long pendCount  = allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING).count();
            ctx.append("Summary: ").append(totalApps).append(" total, ")
               .append(selCount).append(" selected, ")
               .append(pendCount).append(" pending.\n");
        }

        return ctx.toString();
    }

    // ── Admin contexts ──────────────────────────────────────────────────────

    private String buildAdminContext(String msg, User user) {
        StringBuilder ctx = new StringBuilder();
        ctx.append("Admin user: ").append(user.getName()).append("\n");

        long totalUsers    = userRepository.count();
        long students      = userRepository.countByRole(Role.STUDENT);
        long companies     = userRepository.countByRole(Role.COMPANY);
        long totalJobs     = jobRepository.count();
        long openJobs      = jobRepository.countByStatus(JobStatus.OPEN);
        long totalApps     = applicationRepository.count();

        // Pending approvals: companies where approved = false
        List<User> pendingCompanies = userRepository.findByRoleAndApproved(Role.COMPANY, false);
        List<User> blockedUsers     = userRepository.findByBlocked(true);

        ctx.append("Platform Stats:\n")
           .append("  Total users: ").append(totalUsers).append("\n")
           .append("  Students: ").append(students).append("\n")
           .append("  Companies: ").append(companies).append("\n")
           .append("  Total jobs: ").append(totalJobs).append("\n")
           .append("  Open jobs: ").append(openJobs).append("\n")
           .append("  Total applications: ").append(totalApps).append("\n");

        if (containsAny(msg, "pending", "approval", "approve", "company")) {
            ctx.append("Pending company approvals (").append(pendingCompanies.size()).append("):\n");
            pendingCompanies.stream().limit(10).forEach(c ->
                ctx.append("  - ").append(c.getName()).append(" (").append(c.getEmail()).append(")\n")
            );
        }

        if (containsAny(msg, "block", "banned", "suspended")) {
            ctx.append("Blocked users (").append(blockedUsers.size()).append("):\n");
            blockedUsers.stream().limit(10).forEach(u ->
                ctx.append("  - ").append(u.getName()).append(" [").append(u.getRole()).append("]\n")
            );
        }

        return ctx.toString();
    }

    // ── Gemini API call ─────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String callGemini(String userMessage, String context, User user) {
        RestTemplate rest = new RestTemplate();
        String url = geminiGenerateUrl; // set by @PostConstruct auto-discovery


        // ── Concise prompt ────────────────────────────────────────────────────
        String prompt = "You are PlacementBot for a Campus Placement System. "
            + "The user is a " + user.getRole() + " named " + user.getName() + ". "
            + "Answer in 2-3 short sentences ONLY. Be direct and concise — no bullet lists, no long explanations. "
            + "Use the data below to answer accurately.\n\n"
            + "Data:\n" + context
            + "\nQuestion: " + userMessage;

        Map<String, Object> requestBody = new java.util.LinkedHashMap<>();
        requestBody.put("contents", List.of(
            Map.of("parts", List.of(Map.of("text", prompt)))
        ));
        requestBody.put("generationConfig", Map.of(
            "temperature",     0.7,
            "maxOutputTokens", 300
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        // ── Retry with exponential backoff on 429 ────────────────────────────
        int maxRetries = 3;
        long backoffMs = 1000; // 1s → 2s → 4s

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                ResponseEntity<Map> response = rest.postForEntity(url, entity, Map.class);
                log.info("Gemini status: {} (attempt {})", response.getStatusCode(), attempt);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    List<Map<String, Object>> candidates =
                        (List<Map<String, Object>>) response.getBody().get("candidates");
                    if (candidates != null && !candidates.isEmpty()) {
                        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                        if (content != null) {
                            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                            if (parts != null && !parts.isEmpty()) {
                                String text = (String) parts.get(0).get("text");
                                if (text != null && !text.isBlank()) {
                                    return text.trim();
                                }
                            }
                        }
                    }
                    log.warn("Gemini returned unexpected body: {}", response.getBody());
                    break; // non-429 bad body — don't retry
                }

            } catch (org.springframework.web.client.HttpClientErrorException e) {
                if (e.getStatusCode().value() == 429) {
                    if (attempt < maxRetries) {
                        log.warn("Gemini 429 — retrying in {}ms (attempt {}/{})", backoffMs, attempt, maxRetries);
                        try { Thread.sleep(backoffMs); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                        backoffMs *= 2;
                        continue;
                    }
                    log.warn("Gemini rate limit exhausted after {} attempts", maxRetries);
                    return "⏳ The AI is overloaded right now (free-tier rate limit). "
                         + "Please wait a minute and try again — your question was noted!";
                }
                log.error("Gemini HTTP error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
                return "⚠️ AI error (" + e.getStatusCode() + "). Check backend logs.";

            } catch (Exception e) {
                log.error("Gemini call failed: {}", e.getMessage(), e);
                return "⚠️ Could not reach AI service: " + e.getMessage();
            }
        }

        // Graceful data-only fallback
        return "Here's what I found:\n\n" + context;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }
}
