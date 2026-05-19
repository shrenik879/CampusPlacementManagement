package shrenikcom.example.campusPlacementSystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class AsyncConfig {
    // Enables @Async methods for non-blocking email dispatch
}
