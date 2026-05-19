package shrenikcom.example.campusPlacementSystem.config;

import org.springframework.boot.cache.autoconfigure.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.data.redis.cache.RedisCacheConfiguration;

import java.time.Duration;

/**
 * Redis cache configuration for the Campus Placement System.
 *
 * Implements CachingConfigurer to register a custom error handler that
 * prevents Redis failures (connection errors, serialization errors) from
 * propagating as HTTP 500 responses to clients.
 *
 * Cached values (analytics, platformStats) are plain Map<String,Object> —
 * fully serializable with JDK serializer.
 *
 * Job listings (Page<Job>) are NOT cached here because:
 *  • PageImpl with JPA lazy-loaded entities is not safely serializable
 *  • The @Cacheable on JobService.searchJobs has been removed accordingly
 *
 * Named caches:
 *  "analytics"     – per-company analytics (AnalyticsService)   TTL: 10 min
 *  "platformStats" – admin platform counters (AdminService)      TTL: 10 min
 *
 * TTL: 10 minutes (600 seconds)
 */
@Configuration
@EnableAspectJAutoProxy
public class RedisConfig implements CachingConfigurer {

    private static final Duration CACHE_TTL = Duration.ofMinutes(10);
    private static final String   KEY_PREFIX = "campus:cache:";

    /**
     * Registers the error handler so Redis errors are logged but never
     * thrown — the cache becomes a silent transparent layer.
     */
    @Override
    public CacheErrorHandler errorHandler() {
        return new RedisCacheErrorHandler();
    }

    /**
     * Customises the auto-configured RedisCacheManager:
     *  - 10-minute TTL
     *  - Key prefix to avoid namespace collisions
     *  - Null values disabled
     */
    @Bean
    public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer() {
        return builder -> {
            RedisCacheConfiguration defaults = RedisCacheConfiguration
                    .defaultCacheConfig()
                    .entryTtl(CACHE_TTL)
                    .prefixCacheNameWith(KEY_PREFIX)
                    .disableCachingNullValues();

            builder
                    .cacheDefaults(defaults)
                    .withCacheConfiguration("analytics",     defaults)
                    .withCacheConfiguration("platformStats", defaults);
        };
    }
}
