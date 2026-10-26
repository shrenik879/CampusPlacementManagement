package shrenikcom.example.campusPlacementSystem.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import shrenikcom.example.campusPlacementSystem.filter.RateLimitFilter;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Primary frontend origin allowed for CORS.
     * In production (Render): set FRONTEND_URL=https://your-app.vercel.app
     * Falls back to http://localhost:5173 for local development.
     */
    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Optional additional allowed origins as a comma-separated list.
     * Example: CORS_EXTRA_ORIGINS=https://staging.vercel.app,http://localhost:3000
     * Leave empty if not needed.
     */
    @Value("${CORS_EXTRA_ORIGINS:}")
    private String corsExtraOrigins;

    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        configurer.setDefaultTimeout(30 * 60 * 1000L);
    }

    /**
     * CORS configuration.
     * Allows the configured frontend origin(s) — never uses wildcard "*".
     * allowCredentials=true is required for JWT auth headers.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Build allowed origins list: always include primary, add extras if provided
        java.util.List<String> origins = new java.util.ArrayList<>();
        origins.add(frontendUrl);
        if (corsExtraOrigins != null && !corsExtraOrigins.isBlank()) {
            for (String extra : corsExtraOrigins.split(",")) {
                String trimmed = extra.trim();
                if (!trimmed.isEmpty()) origins.add(trimmed);
            }
        }

        registry.addMapping("/**")
                .allowedOrigins(origins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    /**
     * Register the rate-limit filter only on the specific paths that need protection.
     * Order=1 ensures it runs early in the filter chain.
     */
    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitFilter filter) {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.addUrlPatterns(
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/forgot-password",
                "/api/applications/apply/*"
        );
        registration.setOrder(1);
        return registration;
    }
}
