
package leyans.RidersHub.Config.Security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Set;

@Component
public class ClientIpResolver {

    private static final Logger log = LoggerFactory.getLogger(ClientIpResolver.class);

    private final Set<String> trustedProxies;

    public ClientIpResolver(@Value("${security.trusted-proxies:127.0.0.1,::1}") String trustedProxiesString) {
        // Parse comma-separated list of trusted proxy IPs from config
        this.trustedProxies = new HashSet<>();
        for (String ip : trustedProxiesString.split(",")) {
            this.trustedProxies.add(ip.trim());
        }
        log.info("Initialized trustedProxies: {}", this.trustedProxies);
    }

    /**     * Extract client IP address from request.     * Only trusts X-Forwarded-For when request comes from a known reverse proxy.     */
    public String getClientIp(HttpServletRequest request) {
        // Get the immediate sender of the request
        String remoteAddr = request.getRemoteAddr();

        // Only trust X-Forwarded-For if the request comes from a trusted proxy
        if (trustedProxies.contains(remoteAddr)) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
                // Extract the first (leftmost) IP which is the original client
                String clientIp = xForwardedFor.split(",")[0].trim();
                log.debug("Client IP from X-Forwarded-For (trusted proxy): {} -> {}", remoteAddr, clientIp);
                return clientIp;
            }

            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                log.debug("Client IP from X-Real-IP (trusted proxy): {} -> {}", remoteAddr, xRealIp);
                return xRealIp;
            }
        }

        // If not from trusted proxy, or headers are missing, use the immediate sender
        log.debug("Client IP from RemoteAddr: {} (not from trusted proxy or headers missing)", remoteAddr);
        return remoteAddr;
    }
}