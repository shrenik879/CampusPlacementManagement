package shrenikcom.example.campusPlacementSystem.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI / Swagger UI configuration.
 *
 * Swagger UI:  /swagger-ui/index.html
 * API JSON  :  /v3/api-docs
 *
 * JWT usage in Swagger:
 *   1. Call POST /api/auth/login to get a token.
 *   2. Click "Authorize" (top-right lock icon).
 *   3. Enter:  Bearer <your-token>
 *   4. All locked endpoints will now include the Authorization header.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8081}")
    private String serverPort;

    /**
     * Public base URL of the backend.
     * On Render this is automatically set as the RENDER_EXTERNAL_URL env var
     * (e.g. https://your-service.onrender.com).
     * Falls back to http://localhost:<port> for local development.
     */
    @Value("${RENDER_EXTERNAL_URL:}")
    private String renderExternalUrl;

    @Bean
    public OpenAPI campusPlacementOpenAPI() {
        Server localServer = new Server()
                .url("http://localhost:" + serverPort)
                .description("Local Development Server");

        List<Server> servers = new java.util.ArrayList<>();
        servers.add(localServer);

        if (renderExternalUrl != null && !renderExternalUrl.isBlank()) {
            servers.add(new Server()
                    .url(renderExternalUrl)
                    .description("Render Production Server"));
        }

        return new OpenAPI()
                .info(apiInfo())
                .servers(servers)
                .components(new Components()
                        .addSecuritySchemes("BearerAuth", jwtSecurityScheme())
                );
    }

    private Info apiInfo() {
        return new Info()
                .title("Campus Placement Management System API")
                .version("1.0.0")
                .description("""
                        REST API for Campus Placement Management System.
                        
                        **Authentication:** This API uses JWT Bearer tokens.
                        1. Register via `POST /api/auth/register`
                        2. Login via `POST /api/auth/login` to receive a token
                        3. Click **Authorize** and enter: `Bearer <your-token>`
                        4. All protected endpoints will now work
                        
                        **Roles:**
                        - `STUDENT` — apply for jobs, upload resume, view recommendations
                        - `COMPANY` — post jobs, manage applications, view analytics
                        - `ADMIN` — manage users, approve companies, view audit logs
                        """)
                .contact(new Contact()
                        .name("Campus Placement System")
                        .email("admin@campusplacement.com")
                )
                .license(new License()
                        .name("MIT License")
                        .url("https://opensource.org/licenses/MIT")
                );
    }

    /**
     * Defines the JWT Bearer security scheme.
     * Controllers use @SecurityRequirement(name = "BearerAuth") to mark endpoints as protected.
     */
    private SecurityScheme jwtSecurityScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Enter your JWT token (without the 'Bearer ' prefix — Swagger adds it automatically)");
    }
}
