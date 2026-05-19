package shrenikcom.example.campusPlacementSystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateRoundRequest {

    @NotNull(message = "Round ID is required")
    private Long roundId;

    @NotBlank(message = "Status is required (PASSED / FAILED)")
    private String status; // PASSED or FAILED

    private String feedback; // optional recruiter feedback

    private Integer score; // optional score
}
