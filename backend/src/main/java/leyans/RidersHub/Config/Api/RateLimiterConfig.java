
package leyans.RidersHub.Config.Api;

import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.core.registry.EntryAddedEvent;
import io.github.resilience4j.core.registry.EntryRemovedEvent;
import io.github.resilience4j.core.registry.RegistryEventConsumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RateLimiterConfig {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterConfig.class);

    private final RateLimiterRegistry rateLimiterRegistry;

    public RateLimiterConfig(RateLimiterRegistry rateLimiterRegistry) {
        this.rateLimiterRegistry = rateLimiterRegistry;
        registerEventConsumer();
    }

    /**     * Register event consumer to log when rate limiters are created/destroyed.     * Helps with debugging rate limiter behavior.     */
    private void registerEventConsumer() {
        rateLimiterRegistry.getEventPublisher()
                .onEntryAdded(event -> logEntryAdded(event))
                .onEntryRemoved(event -> logEntryRemoved(event));
    }

    private void logEntryAdded(EntryAddedEvent<RateLimiter> event) {
        RateLimiter rateLimiter = event.getAddedEntry();
        log.info(" Rate limiter created: {} | Permits: {} per {}",
                event.getAddedEntry().getName(),
                rateLimiter.getRateLimiterConfig().getLimitForPeriod(),
                rateLimiter.getRateLimiterConfig().getLimitRefreshPeriod());
    }

    private void logEntryRemoved(EntryRemovedEvent<RateLimiter> event) {
        log.warn(" Rate limiter removed: {}", event.getRemovedEntry().getName());
    }
}