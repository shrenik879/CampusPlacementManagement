package shrenikcom.example.campusPlacementSystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Root endpoint for friendly greeting and platform information.
 * GET / → returns API status and link to documentation.
 */
@RestController
@Tag(name = "Root", description = "Root welcome endpoint.")
public class RootController {

    @Operation(summary = "API Welcome & Status", description = "Returns basic application status and navigation links.")
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
                "application", "Campus Placement Management System API",
                "status", "UP",
                "version", "1.0.0",
                "timestamp", Instant.now().toString(),
                "endpoints", Map.of(
                        "health", "/api/health",
                        "swaggerUi", "/swagger-ui/index.html",
                        "apiDocs", "/v3/api-docs",
                        "stats", "/api/dashboard/stats"
                )
        ));
    }
}
