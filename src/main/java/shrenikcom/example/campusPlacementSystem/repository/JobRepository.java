package shrenikcom.example.campusPlacementSystem.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import shrenikcom.example.campusPlacementSystem.entity.Job;
import shrenikcom.example.campusPlacementSystem.entity.JobStatus;
import shrenikcom.example.campusPlacementSystem.entity.User;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {

    // Search by title only
    Page<Job> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    // Search by title AND status
    Page<Job> findByTitleContainingIgnoreCaseAndStatus(String title, JobStatus status, Pageable pageable);

    // Filter by status only (no title search)
    Page<Job> findByStatus(JobStatus status, Pageable pageable);

    // All jobs posted by a specific company user
    List<Job> findByCompany(User company);

    // All open jobs (for chatbot recommendations)
    List<Job> findByStatus(JobStatus status);

    // All jobs posted by a company user (by company ID, for chatbot)
    List<Job> findByCompanyId(Long companyId);

    // Count by status (for admin stats)
    long countByStatus(JobStatus status);
}
