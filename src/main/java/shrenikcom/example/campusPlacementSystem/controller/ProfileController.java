package shrenikcom.example.campusPlacementSystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import shrenikcom.example.campusPlacementSystem.dto.ProfileResponse;
import shrenikcom.example.campusPlacementSystem.dto.UpdateProfileRequest;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.service.ProfileService;

/**
 * Profile Management API
 *
 * GET  /api/profile           — fetch current user's profile + role-based stats
 * PUT  /api/profile/update    — update name / skills
 */
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "User profile management: view and update name, skills, and role-specific stats.")
@SecurityRequirement(name = "BearerAuth")
public class ProfileController {

    private final ProfileService profileService;

    @Operation(summary = "Get Profile", description = "Returns the authenticated user's profile including role-specific statistics.")
    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(HttpServletRequest request) {
        User user = getUser(request);
        return ResponseEntity.ok(profileService.getProfile(user));
    }

    @Operation(summary = "Update Profile", description = "Update name or skills for the authenticated user.")
    @PutMapping("/update")
    public ResponseEntity<ProfileResponse> updateProfile(
            HttpServletRequest request,
            @RequestBody UpdateProfileRequest body) {
        User user = getUser(request);
        return ResponseEntity.ok(profileService.updateProfile(user, body));
    }

    private User getUser(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        if (user == null) throw new RuntimeException("User not authenticated");
        return user;
    }
}
