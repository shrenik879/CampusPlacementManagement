package shrenikcom.example.campusPlacementSystem.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shrenikcom.example.campusPlacementSystem.dto.CreateRoundsRequest;
import shrenikcom.example.campusPlacementSystem.dto.RoundResponse;
import shrenikcom.example.campusPlacementSystem.dto.UpdateRoundRequest;
import shrenikcom.example.campusPlacementSystem.entity.*;
import shrenikcom.example.campusPlacementSystem.repository.ApplicationRepository;
import shrenikcom.example.campusPlacementSystem.repository.RoundRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoundService {

    private final RoundRepository roundRepository;
    private final ApplicationRepository applicationRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    // ── 1. Create rounds for an application ──────────────────────────────────
    @Transactional
    public List<RoundResponse> createRounds(CreateRoundsRequest request) {
        Application application = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new RuntimeException("Application not found"));

        // Prevent duplicate round creation
        if (roundRepository.existsByApplication(application)) {
            throw new RuntimeException("Rounds already exist for this application. Delete them first to recreate.");
        }

        if (request.getRounds() == null || request.getRounds().isEmpty()) {
            throw new RuntimeException("At least one round is required");
        }

        // Mark application as IN_PROGRESS
        application.setStatus(ApplicationStatus.IN_PROGRESS);
        applicationRepository.save(application);

        // Create rounds with sequential ordering
        List<Round> rounds = new java.util.ArrayList<>();
        for (int i = 0; i < request.getRounds().size(); i++) {
            CreateRoundsRequest.RoundItem item = request.getRounds().get(i);

            LocalDateTime scheduled = null;
            if (item.getScheduledAt() != null && !item.getScheduledAt().isBlank()) {
                scheduled = LocalDateTime.parse(item.getScheduledAt());
            }

            Round round = Round.builder()
                    .application(application)
                    .roundName(item.getRoundName())
                    .roundOrder(i + 1)
                    .status(RoundStatus.PENDING)
                    .scheduledAt(scheduled)
                    .createdAt(LocalDateTime.now())
                    .build();

            rounds.add(round);
        }

        List<Round> saved = roundRepository.saveAll(rounds);

        // Notify student that rounds have been created
        User student = application.getStudent();
        Job job = application.getJob();
        String companyName = job.getCompany() != null ? job.getCompany().getName() : "Company";

        emailService.sendRoundScheduledEmail(
                student.getEmail(),
                student.getName(),
                job.getTitle(),
                companyName,
                saved.size() + " recruitment rounds have been created for your application"
        );

        log.info("Created {} rounds for application #{}", saved.size(), application.getId());
        return saved.stream().map(r -> toResponse(r, application)).toList();
    }

    // ── 2. Get all rounds for an application ─────────────────────────────────
    public List<RoundResponse> getRounds(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        List<Round> rounds = roundRepository.findByApplicationOrderByRoundOrderAsc(application);
        return rounds.stream().map(r -> toResponse(r, application)).toList();
    }

    // ── 3. Update round status ───────────────────────────────────────────────
    @Transactional
    public RoundResponse updateRound(UpdateRoundRequest request) {
        Round round = roundRepository.findById(request.getRoundId())
                .orElseThrow(() -> new RuntimeException("Round not found"));

        Application application = round.getApplication();

        // Parse status
        RoundStatus newStatus;
        try {
            newStatus = RoundStatus.valueOf(request.getStatus().toUpperCase());
        } catch (Exception e) {
            throw new RuntimeException("Invalid status. Use PASSED or FAILED");
        }

        if (newStatus == RoundStatus.PENDING) {
            throw new RuntimeException("Cannot set status back to PENDING");
        }

        // ── Enforce sequential order: previous rounds must be PASSED ─────────
        List<Round> allRounds = roundRepository.findByApplicationOrderByRoundOrderAsc(application);
        for (Round prev : allRounds) {
            if (prev.getRoundOrder() < round.getRoundOrder()) {
                if (prev.getStatus() != RoundStatus.PASSED) {
                    throw new RuntimeException(
                            "Cannot update round '" + round.getRoundName() + "' — "
                                    + "previous round '" + prev.getRoundName() + "' is " + prev.getStatus()
                    );
                }
            }
        }

        // Update the round
        round.setStatus(newStatus);
        round.setFeedback(request.getFeedback());
        round.setScore(request.getScore());
        round.setUpdatedAt(LocalDateTime.now());
        roundRepository.save(round);

        // ── Determine overall application status ─────────────────────────────
        User student = application.getStudent();
        Job job = application.getJob();
        String companyName = job.getCompany() != null ? job.getCompany().getName() : "Company";

        try {
            if (newStatus == RoundStatus.FAILED) {
                // Any failure → Application REJECTED
                application.setStatus(ApplicationStatus.REJECTED);
                applicationRepository.save(application);

                notificationService.pushRoundUpdate(student.getId(), job.getTitle(), companyName,
                        round.getRoundName(), "FAILED");
                notificationService.pushStatusUpdate(student.getId(), job.getTitle(), companyName, "REJECTED");
                emailService.sendStatusUpdate(student.getEmail(), job.getTitle(), companyName, "REJECTED");

                log.info("Application #{} REJECTED — failed round '{}'", application.getId(), round.getRoundName());

            } else if (newStatus == RoundStatus.PASSED) {
                // Check if ALL rounds are now PASSED
                boolean allPassed = allRounds.stream()
                        .allMatch(r -> r.getId().equals(round.getId())
                                ? newStatus == RoundStatus.PASSED
                                : r.getStatus() == RoundStatus.PASSED);

                // Always push round passed notification
                notificationService.pushRoundUpdate(student.getId(), job.getTitle(), companyName,
                        round.getRoundName(), "PASSED");

                if (allPassed) {
                    application.setStatus(ApplicationStatus.SELECTED);
                    applicationRepository.save(application);

                    notificationService.pushStatusUpdate(student.getId(), job.getTitle(), companyName, "SELECTED");
                    emailService.sendStatusUpdate(student.getEmail(), job.getTitle(), companyName, "SELECTED");

                    log.info("Application #{} SELECTED — all rounds passed", application.getId());
                } else {
                    emailService.sendRoundScheduledEmail(
                            student.getEmail(),
                            student.getName(),
                            job.getTitle(),
                            companyName,
                            "You passed '" + round.getRoundName() + "'! Next round is coming up."
                    );
                }
            }
        } catch (Exception e) {
            // Notifications are best-effort — don't fail the round update
            log.warn("Notification error during round update: {}", e.getMessage());
        }

        return toResponse(round, application);
    }

    // ── Response mapper ──────────────────────────────────────────────────────
    private RoundResponse toResponse(Round round, Application application) {
        return RoundResponse.builder()
                .id(round.getId())
                .applicationId(application.getId())
                .roundName(round.getRoundName())
                .status(round.getStatus().name())
                .roundOrder(round.getRoundOrder())
                .scheduledAt(round.getScheduledAt())
                .feedback(round.getFeedback())
                .score(round.getScore())
                .createdAt(round.getCreatedAt())
                .updatedAt(round.getUpdatedAt())
                .studentName(application.getStudent().getName())
                .jobTitle(application.getJob().getTitle())
                .companyName(application.getJob().getCompany() != null
                        ? application.getJob().getCompany().getName() : "Company")
                .build();
    }
}
