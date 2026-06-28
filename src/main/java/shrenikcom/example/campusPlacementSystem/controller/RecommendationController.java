package shrenikcom.example.campusPlacementSystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import shrenikcom.example.campusPlacementSystem.entity.Role;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.service.RecommendationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendations", description = "AI-powered job recommendations scored by student skills and history.")
@SecurityRequirement(name = "BearerAuth")
public class RecommendationController {

    private final RecommendationService recommendationService;

    /**
     * GET /api/recommendations
     * Returns up to 5 recommended open jobs for the authenticated student,
     * scored by keyword match against their skills and past applied job titles.
     */
    @Operation(summary = "Get Job Recommendations", description = "Returns up to 5 recommended open jobs for the authenticated student, ranked by skill match.")
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getRecommendations(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");

        if (user == null) {
            throw new RuntimeException("User not authenticated");
        }
        if (user.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can view recommendations");
        }

        List<Map<String, Object>> recommendations = recommendationService.getRecommendations(user);
        return ResponseEntity.ok(recommendations);
    }
}
