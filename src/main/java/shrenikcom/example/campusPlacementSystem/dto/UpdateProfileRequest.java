package shrenikcom.example.campusPlacementSystem.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String skills; // student only — comma separated
}
