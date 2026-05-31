package leyans.RidersHub.Service.Auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import java.util.Map;

@Service
public class SupabaseAuthService {

    private static final Logger log = LoggerFactory.getLogger(SupabaseAuthService.class);

    private final WebClient webClient;

    public SupabaseAuthService(
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.anon-key}") String anonKey) {

        this.webClient = WebClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", anonKey)
                .defaultHeader("Authorization", "Bearer " + anonKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Registers user in Supabase Auth only.
     * Supabase sends verification email automatically.
     */
    public void signUp(String email, String password) {
        try {
            webClient.post()
                    .uri("/auth/v1/signup")
                    .bodyValue(Map.of(
                            "email", email,
                            "password", password
                    ))
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.info("Supabase signUp triggered for: {}", email);

        } catch (WebClientResponseException e) {
            log.error("Supabase signUp failed for {}: {}", email, e.getResponseBodyAsString());
            throw new RuntimeException("Registration failed. Try again.");
        }
    }

    /**
     * Exchanges the code from the verification link
     * for a Supabase session — we only need to confirm
     * the email is verified, then issue our own JWT.
     */
    public String exchangeCodeForEmail(String code) {
        try {
            Map response = webClient.post()
                    .uri("/auth/v1/token?grant_type=pkce")
                    .bodyValue(Map.of("auth_code", code))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            // Extract email from Supabase response
            Map user = (Map) response.get("user");
            return (String) user.get("email");

        } catch (WebClientResponseException e) {
            log.error("Supabase code exchange failed: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Invalid or expired verification link.");
        }
    }

    public String getEmailFromTokenHash(String tokenHash, String type) {
        try {
            Map<?, ?> response = webClient.post()
                    .uri("/auth/v1/verify")
                    .bodyValue(Map.of(
                            "token_hash", tokenHash,
                            "type", type
                    ))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new RuntimeException("Empty response from Supabase verify endpoint");
            }

            // Supabase returns { user: { email: "..." }, access_token: "..." }
            Map<?, ?> user = (Map<?, ?>) response.get("user");
            if (user == null) {
                throw new RuntimeException("No user object in Supabase verify response");
            }

            String email = (String) user.get("email");
            if (email == null || email.isBlank()) {
                throw new RuntimeException("No email in Supabase verify response");
            }

            log.info("✅ [tokenHash] Email verified: {}", email);
            return email;

        } catch (WebClientResponseException e) {
            log.error("❌ [tokenHash] Supabase verify failed: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Invalid or expired verification link. Please register again.");
        }
    }


    public String getEmailFromToken(String supabaseJwt) {
        try {
            // JWT is: header.payload.signature
            String[] parts = supabaseJwt.split("\\.");
            if (parts.length != 3) {
                throw new RuntimeException("Invalid token format");
            }

            // Decode base64 payload
            String payload = new String(
                    java.util.Base64.getUrlDecoder().decode(parts[1])
            );

            // Parse JSON to get email
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(payload);

            String email = node.get("email").asText();
            if (email == null || email.isBlank()) {
                throw new RuntimeException("No email in token");
            }

            log.info("Email extracted from Supabase token: {}", email);
            return email;

        } catch (Exception e) {
            log.error("Failed to decode Supabase token: {}", e.getMessage());
            throw new RuntimeException("Invalid verification token.");
        }
    }

}