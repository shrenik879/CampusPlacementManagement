package shrenikcom.example.campusPlacementSystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateRoundsRequest {

    @NotNull(message = "Application ID is required")
    private Long applicationId;

    @NotNull(message = "Rounds list is required")
    private List<RoundItem> rounds;

    @Data
    public static class RoundItem {
        @NotBlank(message = "Round name is required")
        private String roundName;

        private String scheduledAt; // ISO datetime string, optional
    }
}
