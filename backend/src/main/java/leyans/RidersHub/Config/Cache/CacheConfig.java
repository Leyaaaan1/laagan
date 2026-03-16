//package leyans.RidersHub.Config.Cache;
//
//
//import com.github.benmanes.caffeine.cache.Caffeine;
//import org.springframework.cache.CacheManager;
//import org.springframework.cache.annotation.EnableCaching;
//import org.springframework.cache.caffeine.CaffeineCache;
//import org.springframework.cache.caffeine.CaffeineCacheManager;
//import org.springframework.cache.support.SimpleCacheManager;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//
//import java.util.Arrays;
//import java.util.concurrent.TimeUnit;
//
//@Configuration
//@EnableCaching
//public class CacheConfig {
//
//    @Bean
//    public CacheManager cacheManager() {
//        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
//        cacheManager.setCaffeine(caffeineCacheBuilder());
//        return cacheManager;
//    }
//
//    private Caffeine<Object, Object> caffeineCacheBuilder() {
//        return Caffeine.newBuilder()
//                .initialCapacity(100)
//                .maximumSize(10_000)
//                .expireAfterWrite(1, TimeUnit.HOURS)
//                .recordStats();
//    }
//
//    @Bean
//    public CacheManager specificCacheManager() {
//        SimpleCacheManager cacheManager = new SimpleCacheManager();
//        cacheManager.setCaches(Arrays.asList(
//                new CaffeineCache("nominatimReverse",
//                        Caffeine.newBuilder()
//                                .maximumSize(5000)
//                                .expireAfterWrite(1, TimeUnit.HOURS)
//                                .recordStats()
//                                .build()),
//                new CaffeineCache("nominatimSearch",
//                        Caffeine.newBuilder()
//                                .maximumSize(3000)
//                                .expireAfterWrite(30, TimeUnit.MINUTES)
//                                .recordStats()
//                                .build()),
//                new CaffeineCache("psgcLookup",
//                        Caffeine.newBuilder()
//                                .maximumSize(2000)
//                                .expireAfterWrite(2, TimeUnit.HOURS)
//                                .recordStats()
//                                .build()),
//                new CaffeineCache("routeDirections",
//                        Caffeine.newBuilder()
//                                .maximumSize(1000)
//                                .expireAfterWrite(1, TimeUnit.HOURS)
//                                .recordStats()
//                                .build()),
//                new CaffeineCache("distances",
//                        Caffeine.newBuilder()
//                                .maximumSize(10000)
//                                .expireAfterWrite(24, TimeUnit.HOURS)
//                                .recordStats()
//                                .build())
//        ));
//        cacheManager.initializeCaches();
//        return cacheManager;
//    }
//}