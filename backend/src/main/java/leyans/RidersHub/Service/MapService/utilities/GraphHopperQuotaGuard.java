package leyans.RidersHub.Service.MapService.utilities;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;

@Component
public class GraphHopperQuotaGuard {

    @Value("${graphhopper.quota.daily-limit}")
    private int dailyCreditLimit;

    private static final Duration TTL = Duration.ofHours(26);
    private final RedisTemplate<String, String> redisTemplate;

    public GraphHopperQuotaGuard(RedisTemplate<String, String> ridersHubRedisTemplate) {
        this.redisTemplate = ridersHubRedisTemplate;
    }

    public boolean tryConsume(int credits) {
        String key = "gh:quota:" + LocalDate.now();
        Long used = redisTemplate.opsForValue().increment(key, credits);
        redisTemplate.expire(key, TTL);
        return used != null && used <= dailyCreditLimit;
    }
}