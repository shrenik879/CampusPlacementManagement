package shrenikcom.example.campusPlacementSystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import shrenikcom.example.campusPlacementSystem.dto.CreateRoundsRequest;
import shrenikcom.example.campusPlacementSystem.dto.RoundResponse;
import shrenikcom.example.campusPlacementSystem.dto.UpdateRoundRequest;
import shrenikcom.example.campusPlacementSystem.service.RoundService;

import java.util.List;

@RestController
@RequestMapping("/api/rounds")
@RequiredArgsConstructor
@Tag(name = "Rounds", description = "Recruitment rounds: create rounds per application, update pass/fail status with feedback.")
@SecurityRequirement(name = "BearerAuth")
public class RoundController {

    private final RoundService roundService;

    /**
     * POST /api/rounds/create
     * Create recruitment rounds for an application.
     * Body: { applicationId, rounds: [{ roundName, scheduledAt? }] }
     */
    @Operation(summary = "Create Rounds", description = "Create recruitment rounds for a job application. COMPANY role required.")
    @PostMapping("/create")
    public ResponseEntity<List<RoundResponse>> createRounds(@Valid @RequestBody CreateRoundsRequest request) {
        List<RoundResponse> rounds = roundService.createRounds(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(rounds);
    }

    /**
     * GET /api/rounds/application/{applicationId}
     * Get all rounds for an application, ordered by roundOrder.
     */
    @Operation(summary = "Get Rounds", description = "Get all recruitment rounds for an application, ordered by round number.")
    @GetMapping("/application/{applicationId}")
    public ResponseEntity<List<RoundResponse>> getRounds(@PathVariable Long applicationId) {
        List<RoundResponse> rounds = roundService.getRounds(applicationId);
        return ResponseEntity.ok(rounds);
    }

    /**
     * POST /api/rounds/update
     * Update a round's status (PASSED/FAILED) with optional feedback and score.
     * Auto-determines application's final status.
     */
    @Operation(summary = "Update Round", description = "Update a round's result (PASSED/FAILED) with optional feedback and score. Auto-determines final application status.")
    @PostMapping("/update")
    public ResponseEntity<RoundResponse> updateRound(@Valid @RequestBody UpdateRoundRequest request) {
        RoundResponse round = roundService.updateRound(request);
        return ResponseEntity.ok(round);
    }
}
