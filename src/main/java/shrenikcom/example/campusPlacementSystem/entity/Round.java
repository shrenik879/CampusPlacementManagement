package shrenikcom.example.campusPlacementSystem.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "rounds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Round {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    @JsonIgnore
    private Application application;

    @Column(nullable = false)
    private String roundName; // e.g. "Resume Screening", "Aptitude Test", "Coding Round"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RoundStatus status = RoundStatus.PENDING;

    @Column(nullable = false)
    private Integer roundOrder; // 1, 2, 3... determines sequence

    private LocalDateTime scheduledAt;

    @Column(length = 1000)
    private String feedback; // optional recruiter feedback

    private Integer score; // optional numeric score

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
