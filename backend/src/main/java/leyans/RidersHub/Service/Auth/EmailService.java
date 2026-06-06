package leyans.RidersHub.Service.Auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${email.verification.from-email}")
    private String fromEmail;

    @Value("${email.verification.sender-name}")
    private String senderName;

    @Value("${email.verification.frontend-url}")
    private String frontendUrl;

    @Value("${brevo.api-key}")
    private String brevoApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendVerificationEmail(String toEmail, String token) {
        try {
            String verificationLink = frontendUrl + "/riders/verify-email?token=" + token;
            String subject = "Laagan - Verify Your Email";

            String htmlContent = """
                    <html>
                        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h2 style="color: #333;">Welcome to Laagan! 🏍️</h2>
                                <p style="color: #666; font-size: 16px;">
                                    Thank you for registering. Please verify your email address to activate your account.
                                </p>
                                <p style="color: #666; font-size: 14px;">
                                    <strong>This link expires in 30 minutes.</strong>
                                </p>
                                <a href="%s" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
                                    Verify Email
                                </a>
                                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                                    If you didn't create this account, you can ignore this email.
                                </p>
                                <p style="color: #999; font-size: 12px;">
                                    Or copy this link: <br/>
                                    <code style="background-color: #f0f0f0; padding: 5px; border-radius: 3px;">%s</code>
                                </p>
                            </div>
                        </body>
                    </html>
                    """.formatted(verificationLink, verificationLink);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);  // ← different from Resend

            Map<String, Object> body = Map.of(
                    "sender", Map.of("name", senderName, "email", fromEmail),
                    "to", List.of(Map.of("email", toEmail)),
                    "subject", subject,
                    "htmlContent", htmlContent
            );

            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.brevo.com/v3/transactional-emails",
                    new HttpEntity<>(body, headers),
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Verification email sent to: {}", toEmail);
            } else {
                throw new RuntimeException("Resend API error: " + response.getBody());
            }

        } catch (Exception e) {
            log.error("Error sending verification email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send verification email: " + e.getMessage());
        }
    }
}