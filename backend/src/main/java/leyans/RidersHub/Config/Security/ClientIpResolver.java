package leyans.RidersHub.Config.Security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class ClientIpResolver {

    private static final Logger log = LoggerFactory.getLogger(ClientIpResolver.class);

    /**
     * Extract client IP address from request.
     * Handles X-Forwarded-For header (load balancer / reverse proxy)
     */
    public String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
            String clientIp = xForwardedFor.split(",")[0].trim();
            log.debug("Client IP from X-Forwarded-For: {}", clientIp);
            return clientIp;
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            log.debug("Client IP from X-Real-IP: {}", xRealIp);
            return xRealIp;
        }

        String remoteAddr = request.getRemoteAddr();
        log.debug("Client IP from RemoteAddr: {}", remoteAddr);
        return remoteAddr;
    }
}