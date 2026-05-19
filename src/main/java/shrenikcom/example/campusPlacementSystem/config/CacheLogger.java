package shrenikcom.example.campusPlacementSystem.config;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.interceptor.SimpleKeyGenerator;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * AOP aspect that logs cache HIT / MISS for every @Cacheable method.
 *
 * How it works:
 *  • The pointcut intercepts all methods annotated with @Cacheable.
 *  • Before the real method is called the aspect checks whether the value
 *    already exists in the target cache.
 *  • It logs HIT (served from Redis, DB not queried) or MISS (DB will be
 *    queried; Spring will populate the cache with the result).
 *
 * Log level is DEBUG so these lines do not appear in production unless
 * the logger level is explicitly lowered (configured in application.properties).
 */
@Slf4j
@Aspect
@Component
public class CacheLogger {

    private final CacheManager cacheManager;

    public CacheLogger(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Intercepts every method annotated with @Cacheable in the service layer.
     * Resolves the cache name and key, then checks for a hit before delegation.
     */
    @Around("@annotation(cacheable)")
    public Object logCacheAccess(ProceedingJoinPoint pjp,
                                 org.springframework.cache.annotation.Cacheable cacheable) throws Throwable {

        String methodName = pjp.getSignature().toShortString();
        String[] cacheNames = cacheable.value().length > 0
                ? cacheable.value()
                : cacheable.cacheNames();

        // Build a simple key from arguments (mirrors Spring's default key strategy)
        Object key = SimpleKeyGenerator.generateKey(pjp.getArgs());

        boolean hit = false;
        for (String cacheName : cacheNames) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null && cache.get(key) != null) {
                hit = true;
                break;
            }
        }

        if (hit) {
            log.debug("[CACHE HIT]  method={} caches={} key={}",
                    methodName, Arrays.toString(cacheNames), key);
        } else {
            log.debug("[CACHE MISS] method={} caches={} key={} — querying database",
                    methodName, Arrays.toString(cacheNames), key);
        }

        Object result = pjp.proceed();

        if (!hit) {
            log.debug("[CACHE POPULATE] method={} caches={} key={} — result stored in Redis",
                    methodName, Arrays.toString(cacheNames), key);
        }

        return result;
    }
}
