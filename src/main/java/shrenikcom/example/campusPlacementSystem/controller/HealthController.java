package shrenikcom.example.campusPlacementSystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Lightweight health check endpoint for Render's health-check probe.
 * GET /api/health → { "status": "UP", "timestamp": "..." }
 *
 * This endpoint is public (no JWT required) — see SecurityConfig PUBLIC_PATHS.
 */
@RestController
@RequestMapping("/api/health")
@Tag(name = "Health", description = "Health check endpoint for load balancers and deployment platforms.")
public class HealthController {

    @Operation(summary = "Health Check", description = "Returns application status. Used by Render health checks. No authentication required.")
    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", Instant.now().toString()
        ));
    }
}
