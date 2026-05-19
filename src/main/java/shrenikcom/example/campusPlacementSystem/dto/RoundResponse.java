package shrenikcom.example.campusPlacementSystem.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RoundResponse {
    private Long id;
    private Long applicationId;
    private String roundName;
    private String status;
    private Integer roundOrder;
    private LocalDateTime scheduledAt;
    private String feedback;
    private Integer score;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Application context
    private String studentName;
    private String jobTitle;
    private String companyName;
}
