package shrenikcom.example.campusPlacementSystem.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Dual-delivery notification service:
 *  1. Stores notifications in-memory (REST fallback / offline users)
 *  2. Pushes in real-time over WebSocket (STOMP) when client is connected
 *
 * WebSocket channels:
 *   /user/{userId}/queue/notifications  — personal push (status/round updates)
 *   /topic/jobs                         — broadcast (new job posted)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    // Map of userId → list of notification maps (newest first) — REST fallback store
    private final Map<Long, List<Map<String, Object>>> store = new ConcurrentHashMap<>();

    /**
     * Get all notifications for a user.
     */
    public List<Map<String, Object>> getNotifications(Long userId) {
        return store.getOrDefault(userId, Collections.emptyList());
    }

    /**
     * Mark all notifications as read for a user.
     */
    public void markAllRead(Long userId) {
        List<Map<String, Object>> list = store.get(userId);
        if (list != null) {
            list.forEach(n -> n.put("read", true));
        }
    }

    /**
     * Clear all notifications for a user.
     */
    public void clearNotifications(Long userId) {
        store.remove(userId);
    }

    // ── Push helpers ─────────────────────────────────────────────────────────

    /**
     * Push a status update notification to a specific student.
     */
    public void pushStatusUpdate(Long studentId, String jobTitle, String companyName, String newStatus) {
        String message;
        switch (newStatus) {
            case "SELECTED":
                message = "🎉 Congratulations! Selected for " + jobTitle + " at " + companyName;
                break;
            case "REJECTED":
                message = "❌ Application rejected for " + jobTitle + " at " + companyName;
                break;
            case "IN_PROGRESS":
                message = "📋 Rounds scheduled for " + jobTitle + " at " + companyName;
                break;
            default:
                message = "📋 " + jobTitle + " — " + newStatus;
        }

        addNotification(studentId, Map.of(
                "id", UUID.randomUUID().toString(),
                "type", "status_update",
                "message", message,
                "jobTitle", jobTitle,
                "companyName", companyName,
                "status", newStatus,
                "timestamp", System.currentTimeMillis(),
                "read", false
        ));

        // Real-time WebSocket push (no-op if client is not connected)
        try {
            Map<String, Object> wsPayload = new HashMap<>(Map.of(
                    "id", UUID.randomUUID().toString(),
                    "type", "status_update",
                    "message", message,
                    "jobTitle", jobTitle,
                    "companyName", companyName,
                    "status", newStatus,
                    "timestamp", System.currentTimeMillis(),
                    "read", false
            ));
            messagingTemplate.convertAndSendToUser(studentId.toString(), "/queue/notifications", wsPayload);
        } catch (Exception e) {
            log.debug("WS push skipped (client offline): userId={}", studentId);
        }

        log.info("Notification pushed to userId={}: {} → {}", studentId, jobTitle, newStatus);
    }

    /**
     * Push a new-job-posted notification to ALL students.
     * Call this with all student IDs.
     */
    public void pushNewJob(String jobTitle, String companyName) {
        // Store notification for all users who have ever connected
        String message = "🆕 New job: " + jobTitle + " at " + companyName;
        Map<String, Object> notif = Map.of(
                "id", UUID.randomUUID().toString(),
                "type", "new_job",
                "message", message,
                "jobTitle", jobTitle,
                "companyName", companyName,
                "timestamp", System.currentTimeMillis(),
                "read", false
        );

        // Broadcast to all known users (in-memory store)
        store.keySet().forEach(userId -> addNotification(userId, notif));

        // Real-time WebSocket broadcast on /topic/jobs
        try {
            messagingTemplate.convertAndSend("/topic/jobs", (Object) notif);
        } catch (Exception e) {
            log.debug("WS broadcast skipped: {}", e.getMessage());
        }

        log.info("New job notification pushed to {} users: {} at {}", store.size(), jobTitle, companyName);
    }

    /**
     * Push a new-job notification to specific student IDs.
     */
    public void pushNewJobToStudents(List<Long> studentIds, String jobTitle, String companyName) {
        String message = "🆕 New job: " + jobTitle + " at " + companyName;
        Map<String, Object> notif = Map.of(
                "id", UUID.randomUUID().toString(),
                "type", "new_job",
                "message", message,
                "jobTitle", jobTitle,
                "companyName", companyName,
                "timestamp", System.currentTimeMillis(),
                "read", false
        );

        studentIds.forEach(id -> addNotification(id, notif));

        // Real-time WebSocket push to each student
        studentIds.forEach(id -> {
            try {
                messagingTemplate.convertAndSendToUser(id.toString(), "/queue/notifications", notif);
            } catch (Exception e) {
                log.debug("WS push skipped for userId={}", id);
            }
        });

        log.info("New job notification pushed to {} students: {} at {}", studentIds.size(), jobTitle, companyName);
    }

    /**
     * Push a round update notification to a specific student.
     */
    public void pushRoundUpdate(Long studentId, String jobTitle, String companyName,
                                String roundName, String roundStatus) {
        boolean passed = "PASSED".equals(roundStatus);
        String message = passed
                ? "✅ Passed \"" + roundName + "\" for " + jobTitle
                : "❌ Failed \"" + roundName + "\" for " + jobTitle;

        Map<String, Object> notif = new HashMap<>();
        notif.put("id", UUID.randomUUID().toString());
        notif.put("type", "round_update");
        notif.put("message", message);
        notif.put("jobTitle", jobTitle);
        notif.put("companyName", companyName);
        notif.put("roundName", roundName);
        notif.put("roundStatus", roundStatus);
        notif.put("timestamp", System.currentTimeMillis());
        notif.put("read", false);

        addNotification(studentId, notif);

        // Real-time WebSocket push
        try {
            messagingTemplate.convertAndSendToUser(studentId.toString(), "/queue/notifications", notif);
        } catch (Exception e) {
            log.debug("WS push skipped for userId={}", studentId);
        }

        log.info("Round notification pushed to userId={}: {} → {}", studentId, roundName, roundStatus);
    }

    /**
     * Push an admin broadcast notification — raw message, no reformatting.
     */
    public void pushBroadcast(Long userId, String message) {
        Map<String, Object> notif = new HashMap<>();
        notif.put("id",        UUID.randomUUID().toString());
        notif.put("type",      "broadcast");
        notif.put("message",   "📢 " + message);
        notif.put("timestamp", System.currentTimeMillis());
        notif.put("read",      false);

        addNotification(userId, notif);

        try {
            messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/notifications", notif);
        } catch (Exception e) {
            log.debug("WS broadcast push skipped for userId={}", userId);
        }
    }

    /**
     * Register a user so they can receive broadcast notifications.
     */
    public void registerUser(Long userId) {
        store.putIfAbsent(userId, Collections.synchronizedList(new ArrayList<>()));
    }


    // ── Internal ─────────────────────────────────────────────────────────────

    private void addNotification(Long userId, Map<String, Object> notification) {
        store.computeIfAbsent(userId, k -> Collections.synchronizedList(new ArrayList<>()));
        List<Map<String, Object>> list = store.get(userId);
        // Use a mutable copy of the map
        Map<String, Object> mutable = new HashMap<>(notification);
        list.add(0, mutable); // newest first
        // Keep max 50 notifications
        while (list.size() > 50) {
            list.remove(list.size() - 1);
        }
    }

    public int getActiveUsers() {
        return store.size();
    }
}
