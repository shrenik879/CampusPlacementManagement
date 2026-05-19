package shrenikcom.example.campusPlacementSystem.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Token-bucket rate limiting service using Bucket4j.
 *
 * Policies:
 *   LOGIN    — 5 tokens / 1 minute  (keyed by IP)
 *   APPLY    — 10 tokens / 1 minute (keyed by userId)
 *   REGISTER — 3 tokens / 5 minutes (keyed by IP)
 *   FORGOT   — 3 tokens / 10 minutes (keyed by IP)
 */
@Service
public class RateLimitService {

    public enum Policy { LOGIN, APPLY, REGISTER, FORGOT }

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Returns true if the request is allowed (token consumed), false if rate-limited.
     */
    public boolean tryConsume(String key, Policy policy) {
        Bucket bucket = buckets.computeIfAbsent(key + ":" + policy, k -> createBucket(policy));
        return bucket.tryConsume(1);
    }

    /**
     * Returns seconds until next token is available.
     */
    public long getRetryAfterSeconds(String key, Policy policy) {
        Bucket bucket = buckets.get(key + ":" + policy);
        if (bucket == null) return 60L;
        long nanosToWait = bucket.getAvailableTokens() < 1
                ? bucket.estimateAbilityToConsume(1).getNanosToWaitForRefill()
                : 0L;
        return Math.max(1L, nanosToWait / 1_000_000_000L);
    }

    private Bucket createBucket(Policy policy) {
        Bandwidth limit = switch (policy) {
            case LOGIN    -> Bandwidth.builder().capacity(5).refillIntervally(5,   Duration.ofMinutes(1)).build();
            case APPLY    -> Bandwidth.builder().capacity(10).refillIntervally(10, Duration.ofMinutes(1)).build();
            case REGISTER -> Bandwidth.builder().capacity(3).refillIntervally(3,   Duration.ofMinutes(5)).build();
            case FORGOT   -> Bandwidth.builder().capacity(3).refillIntervally(3,   Duration.ofMinutes(10)).build();
        };
        return Bucket.builder().addLimit(limit).build();
    }

    /** Clears all buckets every 10 minutes to prevent unbounded memory growth. */
    @Scheduled(fixedDelay = 10 * 60 * 1000)
    public void evictExpiredBuckets() {
        buckets.clear();
    }
}
