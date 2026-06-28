package shrenikcom.example.campusPlacementSystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import shrenikcom.example.campusPlacementSystem.dto.ChatRequest;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.service.ChatService;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "AI Chat", description = "Gemini AI-powered chatbot for placement queries. Requires authentication.")
@SecurityRequirement(name = "BearerAuth")
public class ChatController {

    private final ChatService chatService;

    /**
     * POST /api/chat
     * Body: { "message": "Show my applications" }
     * Header: Authorization: Bearer <JWT>
     * Returns: { "reply": "..." }
     */
    @Operation(summary = "Chat with AI", description = "Send a message to the Gemini AI assistant. Returns a context-aware reply based on your role and data.")
    @PostMapping
    public ResponseEntity<Map<String, String>> chat(
            @RequestBody ChatRequest request,
            HttpServletRequest httpRequest) {

        User user = (User) httpRequest.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("reply", "Please log in to use the chatbot."));
        }

        if (request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("reply", "Please type a message."));
        }

        String reply = chatService.chat(request.getMessage(), user);
        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
