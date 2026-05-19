package shrenikcom.example.campusPlacementSystem.filter;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.service.RateLimitService;
import shrenikcom.example.campusPlacementSystem.service.RateLimitService.Policy;

import java.io.IOException;

/**
 * Servlet filter that enforces rate limits on sensitive endpoints.
 *
 * Protected routes:
 *   POST /api/auth/login           → 5/min per IP
 *   POST /api/auth/register        → 3/5min per IP
 *   POST /api/auth/forgot-password → 3/10min per IP
 *   POST /api/applications/apply/* → 10/min per userId
 *
 * Returns HTTP 429 with JSON body and Retry-After header on violation.
 */
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String method = request.getMethod();
        String path   = request.getRequestURI();

        if ("POST".equalsIgnoreCase(method)) {
            if (path.equals("/api/auth/login")) {
                if (!checkLimit(request, response, getClientIp(request), Policy.LOGIN)) return;

            } else if (path.equals("/api/auth/register")) {
                if (!checkLimit(request, response, getClientIp(request), Policy.REGISTER)) return;

            } else if (path.equals("/api/auth/forgot-password")) {
                if (!checkLimit(request, response, getClientIp(request), Policy.FORGOT)) return;

            } else if (path.startsWith("/api/applications/apply/")) {
                // Key by userId if authenticated, else by IP
                User user = (User) request.getAttribute("user");
                String key = user != null ? "user:" + user.getId() : getClientIp(request);
                if (!checkLimit(request, response, key, Policy.APPLY)) return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean checkLimit(HttpServletRequest request, HttpServletResponse response,
                               String key, Policy policy) throws IOException {
        if (rateLimitService.tryConsume(key, policy)) {
            return true; // allowed
        }

        long retryAfter = rateLimitService.getRetryAfterSeconds(key, policy);
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(retryAfter));
        response.setHeader("X-RateLimit-Policy", policy.name());

        // Write JSON manually to avoid Jackson dependency issues
        String json = String.format(
            "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again in %d seconds.\",\"retryAfterSeconds\":%d,\"policy\":\"%s\"}",
            retryAfter, retryAfter, policy.name()
        );
        response.getWriter().write(json);
        return false;
    }

    /** Extracts the real client IP, respecting X-Forwarded-For from proxies/load balancers. */
    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
