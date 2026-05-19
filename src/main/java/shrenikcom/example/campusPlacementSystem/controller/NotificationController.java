package shrenikcom.example.campusPlacementSystem.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/notifications
     * Returns all notifications for the authenticated user.
     * Frontend polls this every few seconds.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getNotifications(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        if (user == null) {
            return ResponseEntity.ok(List.of());
        }
        // Registration now happens at WebSocket handshake time (WebSocketConfig).
        // This endpoint is only a REST fallback for notifications missed while offline.
        return ResponseEntity.ok(notificationService.getNotifications(user.getId()));
    }

    /**
     * PUT /api/notifications/read
     * Marks all notifications as read.
     */
    @PutMapping("/read")
    public ResponseEntity<String> markAllRead(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        if (user == null) {
            return ResponseEntity.badRequest().body("Not authenticated");
        }
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok("All marked as read");
    }

    /**
     * DELETE /api/notifications
     * Clear all notifications.
     */
    @DeleteMapping
    public ResponseEntity<String> clearNotifications(HttpServletRequest request) {
        User user = (User) request.getAttribute("user");
        if (user == null) {
            return ResponseEntity.badRequest().body("Not authenticated");
        }
        notificationService.clearNotifications(user.getId());
        return ResponseEntity.ok("Cleared");
    }
}
