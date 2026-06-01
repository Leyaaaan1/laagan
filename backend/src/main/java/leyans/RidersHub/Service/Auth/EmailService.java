
package leyans.RidersHub.Service.Auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.io.UnsupportedEncodingException;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${email.verification.from-email}")
    private String fromEmail;

    @Value("${email.verification.sender-name}")
    private String senderName;

    @Value("${email.verification.frontend-url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**     * Send email verification link     */
    public void sendVerificationEmail(String toEmail, String token) {
        try {
            String verificationLink = frontendUrl + "/riders/verify-email?token=" + token;
            String subject = "RidersHub - Verify Your Email";

            String htmlContent = """
                    <html>
                        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h2 style="color: #333;">Welcome to RidersHub! 🏍️</h2>
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

            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("✅ Verification email sent to: {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Error sending verification email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send verification email: " + e.getMessage());
        }
    }

    /**     * Send HTML email     */
    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail, senderName);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlContent, true); // true = HTML content

        mailSender.send(message);
    }

    /**     * Send plain text email     */
    public void sendSimpleEmail(String toEmail, String subject, String message) {
        try {
            SimpleMailMessage simpleMessage = new SimpleMailMessage();
            simpleMessage.setFrom(fromEmail);
            simpleMessage.setTo(toEmail);
            simpleMessage.setSubject(subject);
            simpleMessage.setText(message);

            mailSender.send(simpleMessage);
            log.info("✅ Simple email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Error sending simple email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }
}