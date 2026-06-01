
package leyans.RidersHub.Service.Auth;

import leyans.RidersHub.Repository.Auth.EmailVerificationTokenRepository;
import leyans.RidersHub.Repository.RiderRepository;
import leyans.RidersHub.model.Rider;
import leyans.RidersHub.model.auth.EmailVerificationToken;
import org.apache.commons.lang3.RandomStringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailService emailService;
    private final RiderRepository riderRepository;

    @Value("${email.verification.token-expiry-minutes:30}")
    private int tokenExpiryMinutes;

    public EmailVerificationService(EmailVerificationTokenRepository tokenRepository,
                                    EmailService emailService, RiderRepository riderRepository) {
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.riderRepository = riderRepository;
    }

    /**     * Generate verification token and send email     */
    public void sendVerificationToken(String email) {
        try {
            // Delete old token if exists
            tokenRepository.deleteByEmail(email);

            // Generate unique token
            String token = generateSecureToken();
            LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(tokenExpiryMinutes);

            // Save token
            EmailVerificationToken verificationToken = new EmailVerificationToken(email, token, expiryTime);
            tokenRepository.save(verificationToken);

            // Send email
            emailService.sendVerificationEmail(email, token);

            log.info("📧 Verification token created for email: {}", email);

        } catch (Exception e) {
            log.error("❌ Error creating verification token for email: {}", email, e);
            throw new RuntimeException("Failed to send verification email: " + e.getMessage());
        }
    }

    /**     * Verify token and mark email as verified     */
    public boolean verifyEmail(String token) {
        EmailVerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired verification token"));

        if (LocalDateTime.now().isAfter(verificationToken.getExpiryTime())) {
            throw new RuntimeException("Verification token has expired. Request a new one.");
        }

        verificationToken.setVerified(true);
        tokenRepository.save(verificationToken);

        Rider rider = riderRepository.findByAuthEmail(verificationToken.getEmail())
                .orElseThrow(() -> new RuntimeException("Rider not found for email: " + verificationToken.getEmail()));
        rider.setEmailVerified(true);
        riderRepository.save(rider);

        log.info(" Email verified successfully: {}", verificationToken.getEmail());
        return true;
    }


    /**     * Check if email is verified     */
    public boolean isEmailVerified(String email) {
        return tokenRepository.findByEmail(email)
                .map(EmailVerificationToken::getVerified)
                .orElse(false);
    }

    /**     * Generate secure random token (64 characters)     */
    private String generateSecureToken() {
        return RandomStringUtils.randomAlphanumeric(64);
    }
}