package shrenikcom.example.campusPlacementSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import shrenikcom.example.campusPlacementSystem.entity.Role;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private String resumeUrl;
    private Boolean approved;
    private boolean blocked;
    private String skills;
}
