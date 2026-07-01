package leyans.RidersHub.Config.Redis;

import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import io.lettuce.core.TimeoutOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.interceptor.KeyGenerator;
import leyans.RidersHub.DTO.Request.RidesDTO.StopPointDTO;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.List;
import java.time.Duration;

@Configuration
@EnableCaching  
public class RedisConfig {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);

    // ── Connection Factory with keep-alive & fast-fail ────────────────────────
    @Bean
    public LettuceConnectionFactory redisConnectionFactory(
            @Value("${spring.data.redis.host}") String host,
            @Value("${spring.data.redis.port}") int port,
            @Value("${spring.data.redis.password:}") String password) {

        log.info("Configuring LettuceConnectionFactory for {}:{}", host, port);

        RedisStandaloneConfiguration serverConfig = new RedisStandaloneConfiguration(host, port);
        if (password != null && !password.isEmpty()) {
            serverConfig.setPassword(password);
        }

        ClientOptions clientOptions = ClientOptions.builder()
                .socketOptions(
                        SocketOptions.builder()
                                .keepAlive(true)                      // TCP keep-alive — prevents silent dead connections after machine sleep
                                .connectTimeout(Duration.ofSeconds(3))
                                .build())
                .timeoutOptions(TimeoutOptions.enabled(Duration.ofSeconds(3)))
                .disconnectedBehavior(
                        ClientOptions.DisconnectedBehavior.REJECT_COMMANDS) // fail fast instead of queueing forever
                .build();

        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                .clientOptions(clientOptions)
                .commandTimeout(Duration.ofSeconds(3))
                .build();

        log.info("LettuceConnectionFactory configured with keep-alive and 3s timeout");
        return new LettuceConnectionFactory(serverConfig, clientConfig);
    }

    // ── String Template ───────────────────────────────────────────────────────
    @Bean
    public RedisTemplate<String, String> ridersHubRedisTemplate(LettuceConnectionFactory connectionFactory) {
        log.info("Configuring ridersHubRedisTemplate<String, String>...");

        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setHashValueSerializer(stringSerializer);

        template.afterPropertiesSet();
        log.info("ridersHubRedisTemplate configured successfully");
        return template;
    }

    // ── Integer Template ──────────────────────────────────────────────────────
    @Bean
    public RedisTemplate<String, Integer> redisTemplateInteger(LettuceConnectionFactory connectionFactory) {
        log.info("Configuring redisTemplateInteger<String, Integer>...");

        RedisTemplate<String, Integer> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jacksonSerializer = new GenericJackson2JsonRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jacksonSerializer);
        template.setHashValueSerializer(jacksonSerializer);

        template.afterPropertiesSet();
        log.info("redisTemplateInteger configured successfully");
        return template;
    }

    // ── Cache Manager — fault-tolerant ────────────────────────────────────────
    @Bean
    public RedisCacheManager cacheManager(LettuceConnectionFactory connectionFactory) {
        log.info("Configuring RedisCacheManager...");

        RedisCacheConfiguration defaultCacheConfig = RedisCacheConfiguration
                .defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        RedisCacheManager cacheManager = RedisCacheManager
                .builder(connectionFactory)
                .cacheDefaults(defaultCacheConfig)
                .transactionAware() // cache misses silently if Redis is down instead of throwing
                .build();

        log.info("RedisCacheManager configured with 1-hour TTL and JSON serialization");
        return cacheManager;
    }
        @Bean
        public KeyGenerator routeKeyGenerator() {
    return (target, method, params) -> {
        double startLat = (double) params[1];
        double startLng = (double) params[0];
        double endLat   = (double) params[3];
        double endLng   = (double) params[2];
        List<StopPointDTO> stops = (List<StopPointDTO>) params[4];
        String profile = (String) params[5];
        return String.format("%.5f,%.5f-%.5f,%.5f-%s-%s",
                startLat, startLng, endLat, endLng, stops, profile);
    };
}
    @Scheduled(fixedRate = 240_000) // every 4 minutes
    public void pingRedis() {
        try {
            RedisTemplate<String, String> template2 = new RedisTemplate<>();
            assert template2.getConnectionFactory() != null;
            template2.getConnectionFactory().getConnection().ping();
        } catch (Exception e) {
            log.debug("Redis keepalive ping failed — will reconnect on next real command");
        }
    }
    
}
