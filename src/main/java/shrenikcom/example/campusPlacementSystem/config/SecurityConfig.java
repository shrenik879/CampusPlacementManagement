package shrenikcom.example.campusPlacementSystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    /** Paths that must always be publicly accessible — no JWT required. */
    private static final String[] PUBLIC_PATHS = {
            // Application public endpoints
            "/api/auth/**",
            "/api/dashboard/**",
            // Swagger UI static assets
            "/swagger-ui/**",
            "/swagger-ui.html",
            // OpenAPI JSON / YAML endpoints
            "/v3/api-docs/**",
            "/v3/api-docs.yaml"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Delegate CORS to WebConfig.addCorsMappings()
                .cors(Customizer.withDefaults())
                // CSRF disabled — stateless JWT API
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Swagger UI + OpenAPI docs + auth endpoints are public
                        .requestMatchers(PUBLIC_PATHS).permitAll()
                        // Everything else is permitted (JWT validation is handled by JwtFilter)
                        .anyRequest().permitAll()
                );
        return http.build();
    }
}
