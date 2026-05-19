package shrenikcom.example.campusPlacementSystem.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import shrenikcom.example.campusPlacementSystem.entity.Application;
import shrenikcom.example.campusPlacementSystem.entity.ApplicationStatus;
import shrenikcom.example.campusPlacementSystem.entity.Job;
import shrenikcom.example.campusPlacementSystem.entity.User;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application,Long> {
    //check if the student already applied
    boolean existsByStudentAndJob(User student, Job job);

    //get all application of a student — JOIN FETCH student+job to prevent N+1
    @EntityGraph(attributePaths = {"student", "job", "job.company"})
    List<Application> findByStudent(User student);

    //get all applicants for a job — JOIN FETCH student to prevent N+1
    @EntityGraph(attributePaths = {"student", "job", "job.company"})
    List<Application> findByJob(Job job);

    // ── Paginated queries ────────────────────────────────────────────────────

    // Paginated: all applications of a student
    Page<Application> findByStudent(User student, Pageable pageable);

    // Paginated: applications of a student filtered by status
    Page<Application> findByStudentAndStatus(User student, ApplicationStatus status, Pageable pageable);

    // Paginated: applicants for a job
    Page<Application> findByJob(Job job, Pageable pageable);

    // Paginated: applicants for a job filtered by status
    Page<Application> findByJobAndStatus(Job job, ApplicationStatus status, Pageable pageable);

    // delete all applications linked to a job (before deleting the job)
    void deleteByJob(Job job);

    // delete all applications linked to a student (before deleting the student)
    void deleteByStudent(User student);

    // count applications by status (for dashboard stats)
    long countByStatus(shrenikcom.example.campusPlacementSystem.entity.ApplicationStatus status);

    // find all applications whose job belongs to a given company user
    List<Application> findByJob_Company(User company);

    // By student ID (for chatbot)
    List<Application> findByStudentId(Long studentId);

    // By job ID (for chatbot)
    List<Application> findByJobId(Long jobId);
}
