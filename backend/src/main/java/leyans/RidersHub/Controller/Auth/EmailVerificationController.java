
package leyans.RidersHub.Controller.Auth;

import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.Service.Auth.EmailVerificationService;
import leyans.RidersHub.model.Rider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/riders")
public class EmailVerificationController {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationController.class);

    private final EmailVerificationService emailVerificationService;
    private final RiderRepository riderRepository;

    public EmailVerificationController(EmailVerificationService emailVerificationService,
                                       RiderRepository riderRepository) {
        this.emailVerificationService = emailVerificationService;
        this.riderRepository = riderRepository;
    }

    /**     * Verify email with token     * GET /riders/verify-email?token=xyz123     */
    @GetMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestParam String token) {
        try {
            emailVerificationService.verifyEmail(token);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(buildHtmlPage(true, "Email Verified!",
                            "Your account is now active. You can close this tab and log in to Laagan."));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.TEXT_HTML)
                    .body(buildHtmlPage(false, "Verification Failed", e.getMessage()));
        }
    }

    private String buildHtmlPage(boolean success, String title, String message) {
        String color = success ? "#8B0000" : "#555";
        String icon = success ? "✓" : "✕";
        String iconBg = success ? "#8B0000" : "#ccc";

        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Laagan – %s</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0d0d0d;
                    font-family: 'Segoe UI', Arial, sans-serif;
                }
                .card {
                    background: #1a1a1a;
                    border: 1px solid #2a2a2a;
                    border-radius: 16px;
                    padding: 48px 40px;
                    max-width: 420px;
                    width: 90%%;
                    text-align: center;
                }
                .icon {
                    width: 64px; height: 64px;
                    border-radius: 50%%;
                    background: %s;
                    color: white;
                    font-size: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                }
                .app-name {
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    color: #8B0000;
                    text-transform: uppercase;
                    margin-bottom: 16px;
                }
                h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #f0f0f0;
                    margin-bottom: 12px;
                }
                p {
                    font-size: 0.92rem;
                    color: #888;
                    line-height: 1.6;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="app-name">Laagan</div>
                <div class="icon">%s</div>
                <h1>%s</h1>
                <p>%s</p>
            </div>
        </body>
        </html>
        """.formatted(title, iconBg, icon, title, message);
    }
    /**     * Resend verification email     * POST /riders/resend-verification     * Body: { "email": "user@example.com" }     */
    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, Object>> resendVerificationEmail(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String email = request.get("email");

        if (email == null || email.isBlank()) {
            response.put("success", false);
            response.put("message", "❌ Email is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        try {
            Rider rider = riderRepository.findByAuthEmail(email)
                    .orElseThrow(() -> new RuntimeException("Rider not found with this email"));

            if (rider.getEmailVerified()) {
                response.put("success", false);
                response.put("message", "✓ Email already verified");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            emailVerificationService.sendVerificationToken(email);

            response.put("success", true);
            response.put("message", "✅ Verification email sent. Check your inbox.");
            log.info("📧 Verification email resent to: {}", email);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", "❌ " + e.getMessage());
            log.warn("❌ Resend verification failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**     * Check if email is verified     * GET /riders/check-email-verified?email=user@example.com     */
    @GetMapping("/check-email-verified")
    public ResponseEntity<Map<String, Object>> checkEmailVerified(@RequestParam String email) {
        Map<String, Object> response = new HashMap<>();

        try {
            boolean isVerified = emailVerificationService.isEmailVerified(email);
            response.put("email", email);
            response.put("verified", isVerified);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "❌ Error checking email verification status");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}