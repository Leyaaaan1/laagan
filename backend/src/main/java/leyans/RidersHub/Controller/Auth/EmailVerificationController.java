
package leyans.RidersHub.Controller.Auth;

import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.Service.Auth.EmailVerificationService;
import leyans.RidersHub.model.Rider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestParam String token) {
        Map<String, Object> response = new HashMap<>();

        try {
            emailVerificationService.verifyEmail(token);
            response.put("success", true);
            response.put("message", "✅ Email verified successfully! You can now log in.");
            log.info("✅ Email verification successful for token: {}", token);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", "❌ " + e.getMessage());
            log.warn("❌ Email verification failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
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