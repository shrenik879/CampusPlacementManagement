package shrenikcom.example.campusPlacementSystem.controller;

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
public class ChatController {

    private final ChatService chatService;

    /**
     * POST /api/chat
     * Body: { "message": "Show my applications" }
     * Header: Authorization: Bearer <JWT>
     * Returns: { "reply": "..." }
     */
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
