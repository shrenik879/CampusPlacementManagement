package shrenikcom.example.campusPlacementSystem.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "applications", indexes = {
        @Index(name = "idx_app_student", columnList = "student_id"),
        @Index(name = "idx_app_job_status", columnList = "job_id,status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) //student who applied
    @JsonIgnore
    @JoinColumn(name = "student_id",nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id",nullable = false)
    private Job job;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status;

}
