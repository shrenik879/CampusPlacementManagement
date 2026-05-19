package shrenikcom.example.campusPlacementSystem.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import shrenikcom.example.campusPlacementSystem.entity.*;
import shrenikcom.example.campusPlacementSystem.repository.ApplicationRepository;
import shrenikcom.example.campusPlacementSystem.repository.JobRepository;
import shrenikcom.example.campusPlacementSystem.repository.RoundRepository;
import shrenikcom.example.campusPlacementSystem.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final RoundRepository roundRepository;

    public String applyJob(Long jobId,Long studentId){
        //get job
        Job job=jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));

        //get student
        User student=userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));

        if(student.getResumeUrl() == null || student.getResumeUrl().isEmpty()) {
            throw new RuntimeException("You must upload a resume before applying");
        }

        //prevent duplicate
        boolean alreadyApplied=applicationRepository.existsByStudentAndJob(student,job);

        if(alreadyApplied){
            throw new RuntimeException("You already applied");
        }

        Application application=Application.builder()
                .student(student)
                .job(job)
                .status(ApplicationStatus.PENDING)
                .build();

        applicationRepository.save(application);

        // Send confirmation email (async — non-blocking)
        emailService.sendApplicationConfirmation(
                student.getEmail(),
                job.getTitle(),
                job.getCompany() != null ? job.getCompany().getName() : "Company"
        );

        return "Applied successfully";
    }

    public List<Map<String,Object>> getApplicants(Long jobId){
        Job job=jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));

        return applicationRepository.findByJob(job).stream().map(app -> {
            Map<String,Object> map = new HashMap<>();
            map.put("id", app.getId());
            map.put("status", app.getStatus());
            map.put("studentName", app.getStudent().getName());
            map.put("studentEmail", app.getStudent().getEmail());
            map.put("resumeUrl", app.getStudent().getResumeUrl());
            return map;
        }).toList();
    }

    /**
     * Paginated version: get applicants for a job with optional status filter.
     */
    public Page<Map<String,Object>> getApplicantsPaged(Long jobId, String status, int page, int size) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        Page<Application> appPage;
        if (status != null && !status.isBlank()) {
            ApplicationStatus appStatus = ApplicationStatus.valueOf(status.toUpperCase());
            appPage = applicationRepository.findByJobAndStatus(job, appStatus, pageable);
        } else {
            appPage = applicationRepository.findByJob(job, pageable);
        }

        return appPage.map(app -> {
            Map<String,Object> map = new HashMap<>();
            map.put("id", app.getId());
            map.put("status", app.getStatus());
            map.put("studentName", app.getStudent().getName());
            map.put("studentEmail", app.getStudent().getEmail());
            map.put("resumeUrl", app.getStudent().getResumeUrl());
            return map;
        });
    }

    public String updateStatus(Long applicationId,String status){

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        ApplicationStatus newStatus;

        try{
            newStatus =ApplicationStatus.valueOf(status.toUpperCase());
        } catch (Exception e){
            throw  new RuntimeException("Invalid status value");
        }

        Job job = application.getJob();
        User student = application.getStudent();
        String companyName = job.getCompany() != null ? job.getCompany().getName() : "Company";

        // ── If SELECTED and job has rounds → auto-create rounds, set IN_PROGRESS ──
        if (newStatus == ApplicationStatus.SELECTED
                && job.getRounds() != null && !job.getRounds().isBlank()) {

            // Only create rounds if none exist yet
            if (!roundRepository.existsByApplication(application)) {
                String[] roundNames = job.getRounds().split(",");
                List<Round> rounds = new ArrayList<>();
                for (int i = 0; i < roundNames.length; i++) {
                    rounds.add(Round.builder()
                            .application(application)
                            .roundName(roundNames[i].trim())
                            .roundOrder(i + 1)
                            .status(RoundStatus.PENDING)
                            .createdAt(LocalDateTime.now())
                            .build());
                }
                roundRepository.saveAll(rounds);

                // Set status to IN_PROGRESS (rounds are active)
                application.setStatus(ApplicationStatus.IN_PROGRESS);
                applicationRepository.save(application);

                // Notify student that rounds have started
                emailService.sendRoundScheduledEmail(
                        student.getEmail(),
                        student.getName(),
                        job.getTitle(),
                        companyName,
                        "Your resume has been shortlisted! " + roundNames.length
                                + " recruitment rounds have been scheduled."
                );
                notificationService.pushStatusUpdate(
                        student.getId(), job.getTitle(), companyName, "IN_PROGRESS"
                );

                return "Resume shortlisted — " + roundNames.length + " rounds created";
            }
        }

        // ── Normal status update (no rounds or REJECTED/PENDING) ──
        application.setStatus(newStatus);
        applicationRepository.save(application);

        // Send status update email (async — non-blocking)
        if (newStatus == ApplicationStatus.SELECTED || newStatus == ApplicationStatus.REJECTED) {
            emailService.sendStatusUpdate(
                    student.getEmail(),
                    job.getTitle(),
                    companyName,
                    newStatus.name()
            );
            notificationService.pushStatusUpdate(
                    student.getId(),
                    job.getTitle(),
                    companyName,
                    newStatus.name()
            );
        }

        return "Status updated successfully";
    }

    public List<Map<String,Object>> getMyApplications(Long studentId){
        User student =userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Application> applications = applicationRepository.findByStudent(student);

        return applications.stream().map(app -> {
            Map<String,Object> map = new HashMap<>();
            map.put("applicationId", app.getId());
            map.put("jobTitle",app.getJob().getTitle());
            map.put("company",app.getJob().getCompany().getName());
            map.put("status",app.getStatus());
            map.put("hasRounds", roundRepository.existsByApplication(app));
            return map;
        }).toList();
    }

    /**
     * Paginated version: get my applications with optional status filter.
     */
    public Page<Map<String,Object>> getMyApplicationsPaged(Long studentId, String status, int page, int size) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        Page<Application> appPage;
        if (status != null && !status.isBlank()) {
            ApplicationStatus appStatus = ApplicationStatus.valueOf(status.toUpperCase());
            appPage = applicationRepository.findByStudentAndStatus(student, appStatus, pageable);
        } else {
            appPage = applicationRepository.findByStudent(student, pageable);
        }

        return appPage.map(app -> {
            Map<String,Object> map = new HashMap<>();
            map.put("applicationId", app.getId());
            map.put("jobTitle", app.getJob().getTitle());
            map.put("company", app.getJob().getCompany().getName());
            map.put("status", app.getStatus());
            map.put("hasRounds", roundRepository.existsByApplication(app));
            return map;
        });
    }


}
