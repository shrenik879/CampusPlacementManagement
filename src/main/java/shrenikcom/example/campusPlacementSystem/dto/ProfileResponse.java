package shrenikcom.example.campusPlacementSystem.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String skills;
    private String resumeUrl;
    private boolean approved;
    // Role-specific stats
    private Map<String, Object> stats;
}
