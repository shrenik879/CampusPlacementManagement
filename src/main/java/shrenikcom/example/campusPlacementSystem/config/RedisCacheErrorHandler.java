package shrenikcom.example.campusPlacementSystem.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

/**
 * Custom cache error handler that logs Redis errors at WARN level
 * but NEVER propagates them to the caller.
 *
 * Without this, a Redis connection failure or serialization error
 * would throw an exception and return HTTP 500 to the client —
 * even though the underlying DB operation is completely fine.
 *
 * With this handler, the cache becomes a transparent layer:
 *  • If Redis is down → app continues, just without caching (DB is queried instead)
 *  • If a value can't be serialized → cache is skipped silently, no error to client
 */
@Slf4j
public class RedisCacheErrorHandler implements CacheErrorHandler {

    @Override
    public void handleCacheGetError(RuntimeException ex, Cache cache, Object key) {
        log.warn("[Redis Cache] GET error on cache='{}' key='{}': {}", cache.getName(), key, ex.getMessage());
    }

    @Override
    public void handleCachePutError(RuntimeException ex, Cache cache, Object key, Object value) {
        log.warn("[Redis Cache] PUT error on cache='{}' key='{}': {}", cache.getName(), key, ex.getMessage());
    }

    @Override
    public void handleCacheEvictError(RuntimeException ex, Cache cache, Object key) {
        log.warn("[Redis Cache] EVICT error on cache='{}' key='{}': {}", cache.getName(), key, ex.getMessage());
    }

    @Override
    public void handleCacheClearError(RuntimeException ex, Cache cache) {
        log.warn("[Redis Cache] CLEAR error on cache='{}': {}", cache.getName(), ex.getMessage());
    }
}
