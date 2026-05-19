package shrenikcom.example.campusPlacementSystem.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs", indexes = {
        @Index(name = "idx_job_company", columnList = "company_id"),
        @Index(name = "idx_job_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id",nullable = false)
    private User company;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    private LocalDateTime createdAt;

    @Column(length = 1000)
    private String rounds; // comma-separated round names, e.g. "Aptitude Test,Coding Round,Technical Interview,HR Interview"

    @Column(nullable = false)
    @Builder.Default
    private Boolean flagged = false;

}
