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
import shrenikcom.example.campusPlacementSystem.service.AnalyticsService;

import java.util.Map;

/**
 * GET /api/analytics/company  — returns full analytics for the authenticated company.
 * Requires COMPANY role.
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Company analytics: application funnels, conversion rates, round statistics.")
@SecurityRequirement(name = "BearerAuth")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @Operation(summary = "Get Company Analytics", description = "Returns full application funnel analytics for the authenticated company.")
    @GetMapping("/company")
    public ResponseEntity<Map<String, Object>> getCompanyAnalytics(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        if (user == null) throw new RuntimeException("User not authenticated");
        if (user.getRole() != Role.COMPANY) throw new RuntimeException("Only companies can view analytics");

        return ResponseEntity.ok(analyticsService.getCompanyAnalytics(user));
    }
}
