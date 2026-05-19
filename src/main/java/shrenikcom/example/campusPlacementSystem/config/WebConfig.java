package shrenikcom.example.campusPlacementSystem.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import shrenikcom.example.campusPlacementSystem.filter.RateLimitFilter;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        configurer.setDefaultTimeout(30 * 60 * 1000L);
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
