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
     * Frontend origin allowed for CORS.
     * Set FRONTEND_URL env var on EC2 to the actual frontend address
     * (e.g. http://your-ec2-ip:3000 or https://yourdomain.com).
     * Falls back to http://localhost:5173 for local development.
     */
    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        configurer.setDefaultTimeout(30 * 60 * 1000L);
    }

    /**
     * CORS configuration.
     * Allows only the configured frontend origin — never uses wildcard "*".
     * allowCredentials=true is required for JWT cookies / auth headers.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(frontendUrl)
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
