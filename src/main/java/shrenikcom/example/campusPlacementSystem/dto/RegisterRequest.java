package shrenikcom.example.campusPlacementSystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import shrenikcom.example.campusPlacementSystem.entity.Role;

@Data
public class RegisterRequest {
    @NotBlank(message = "Name is required")
    private String name;
    @Email(message = "Invalid email")
    @NotBlank
    private String email;
    @NotBlank
    @Size(min = 6,message = "password must be 6+ chars")
    private String password;

    @NotNull
    private Role role;
}
