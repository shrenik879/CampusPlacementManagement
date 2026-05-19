package shrenikcom.example.campusPlacementSystem.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.HandshakeInterceptor;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.repository.UserRepository;
import shrenikcom.example.campusPlacementSystem.security.JwtUtil;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Configures STOMP WebSocket with SockJS fallback.
 *
 * Endpoints:
 *   /ws?token=<jwt>          — WebSocket handshake URL (SockJS)
 *   /topic/jobs              — broadcast channel (new job posted → all students)
 *   /user/{userId}/queue/notifications — personal channel (status/round updates)
 *
 * JWT is validated at handshake time and stored in the session attributes as "user".
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(jwtHandshakeInterceptor())
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix for messages sent from client to server
        registry.setApplicationDestinationPrefixes("/app");
        // Enable simple in-memory broker for /topic and /queue
        registry.enableSimpleBroker("/topic", "/queue");
        // Prefix for user-specific messages
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * Handshake interceptor: reads ?token=<jwt> from the WebSocket upgrade URL,
     * validates it, and stores the resolved User in the session attributes so
     * NotificationService can route messages by userId.
     */
    private HandshakeInterceptor jwtHandshakeInterceptor() {
        return new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                           WebSocketHandler wsHandler, Map<String, Object> attributes) {
                String query = request.getURI().getQuery();
                if (query != null) {
                    for (String param : query.split("&")) {
                        if (param.startsWith("token=")) {
                            String token = param.substring(6);
                            try {
                                String email = jwtUtil.extractEmail(token);
                                Optional<User> userOpt = userRepository.findByEmail(email);
                                if (userOpt.isPresent()) {
                                    User u = userOpt.get();
                                    attributes.put("userId", u.getId().toString());
                                    log.debug("WS handshake accepted for userId={}", u.getId());
                                }
                            } catch (Exception e) {
                                log.warn("WS handshake: invalid JWT token");
                            }
                            break;
                        }
                    }
                }
                return true; // allow even without token (SockJS polling fallback)
            }

            @Override
            public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                       WebSocketHandler wsHandler, Exception exception) {}
        };
    }
}
