package leyans.RidersHub.Controller.Auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.HashMap;
import java.util.Map;
import java.time.Duration;

@RestController
@RequestMapping("/health")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    // CHANGED: Added @Qualifier to explicitly pick our custom bean.
    // Without it, Spring finds both ridersHubRedisTemplate and Spring Boot's
    // stringRedisTemplate and fails with "expected single matching bean but found 2".
    @Autowired(required = false)
    @Qualifier("ridersHubRedisTemplate")
    private RedisTemplate<String, String> redisTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", System.currentTimeMillis());
        response.put("service", "RidersHub API");

        try {
            if (redisTemplate != null) {
                redisTemplate.opsForValue().set("health-check", "ok", Duration.ofSeconds(10));
                String value = redisTemplate.opsForValue().get("health-check");

                if (value != null) {
                    response.put("status", "UP");
                    response.put("database", "✅ Connected");
                    response.put("redis", "✅ Connected");
                    log.info("✅ Health check passed - Redis OK");
                    return ResponseEntity.ok(response);
                } else {
                    throw new Exception("Redis returned null");
                }
            } else {
                response.put("status", "PARTIAL");
                response.put("database", "✅ Connected");
                response.put("redis", "⚠️  Not configured");
                return ResponseEntity.ok(response);
            }

        } catch (Exception e) {
            log.error("❌ Health check failed: {}", e.getMessage());
            response.put("status", "DOWN");
            response.put("database", "⚠️  Unknown");
            response.put("redis", "❌ " + e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }
}