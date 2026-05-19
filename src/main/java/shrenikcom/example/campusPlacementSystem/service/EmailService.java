package shrenikcom.example.campusPlacementSystem.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.List;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    // ── Application Submitted ────────────────────────────────────────────────
    @Async
    public void sendApplicationConfirmation(String studentEmail, String jobTitle, String companyName) {
        String subject = "✅ Application Submitted — " + jobTitle;
        String body = buildHtml(
                "Application Confirmed",
                "Your application for <strong>" + jobTitle + "</strong> at <strong>" + companyName + "</strong> has been submitted successfully.",
                "You'll be notified when the recruiter reviews your application. Good luck!",
                "#16a34a"
        );
        sendEmail(studentEmail, subject, body);
    }

    // ── Status Update (Selected / Rejected) ──────────────────────────────────
    @Async
    public void sendStatusUpdate(String studentEmail, String jobTitle, String companyName, String status) {
        boolean selected = "SELECTED".equalsIgnoreCase(status);
        String emoji = selected ? "🎉" : "📋";
        String subject = emoji + " Application " + (selected ? "Selected" : "Rejected") + " — " + jobTitle;
        String statusText = selected
                ? "Congratulations! You have been <strong style=\"color:#16a34a\">SELECTED</strong>"
                : "Your application status has been updated to <strong style=\"color:#dc2626\">REJECTED</strong>";

        String body = buildHtml(
                "Application Status Update",
                statusText + " for <strong>" + jobTitle + "</strong> at <strong>" + companyName + "</strong>.",
                selected
                        ? "The company will contact you with next steps. Keep up the great work!"
                        : "Don't be discouraged! Keep applying and improving your skills.",
                selected ? "#16a34a" : "#dc2626"
        );
        sendEmail(studentEmail, subject, body);
    }

    // ── New Job Posted ───────────────────────────────────────────────────────
    @Async
    public void sendNewJobNotification(List<String> studentEmails, String jobTitle, String companyName) {
        String subject = "🆕 New Job Posted — " + jobTitle + " at " + companyName;
        String body = buildHtml(
                "New Job Opportunity",
                "A new position has been posted: <strong>" + jobTitle + "</strong> at <strong>" + companyName + "</strong>.",
                "Log in to the placement portal to view details and apply!",
                "#2563eb"
        );

        for (String email : studentEmails) {
            sendEmail(email, subject, body);
        }
    }

    // ── Password Reset Email ─────────────────────────────────────────────────
    @Async
    public void sendPasswordResetEmail(String email, String name, String resetLink) {
        String subject = "🔒 Password Reset — Campus Placement Portal";
        String body = buildHtml(
                "Password Reset Request",
                "Hi <strong>" + (name != null ? name : "User") + "</strong>,<br><br>"
                        + "We received a request to reset your password. Click the link below to set a new password:<br><br>"
                        + "<a href=\"" + resetLink + "\" style=\"display:inline-block;background:#2563eb;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;\">Reset Password</a><br><br>"
                        + "Or copy this link: <br><span style=\"color:#3b82f6;word-break:break-all;\">" + resetLink + "</span>",
                "This link expires in 15 minutes. If you didn't request this, ignore this email.",
                "#2563eb"
        );
        sendEmail(email, subject, body);
    }

    // ── Round Notification Email ─────────────────────────────────────────────
    @Async
    public void sendRoundScheduledEmail(String email, String name, String jobTitle, String companyName, String detail) {
        String subject = "📋 Recruitment Update — " + jobTitle + " at " + companyName;
        String body = buildHtml(
                "Recruitment Round Update",
                "Hi <strong>" + (name != null ? name : "Student") + "</strong>,<br><br>"
                        + detail + "<br><br>"
                        + "Position: <strong>" + jobTitle + "</strong> at <strong>" + companyName + "</strong>.",
                "Log in to the placement portal to check your round details.",
                "#7c3aed"
        );
        sendEmail(email, subject, body);
    }

    // ── Internal send helper ─────────────────────────────────────────────────
    private void sendEmail(String to, String subject, String htmlBody) {
        if (fromEmail == null || fromEmail.isBlank()) {
            log.warn("MAIL not configured — skipping email to {}: {}", to, subject);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("✅ Email sent to {} — {}", to, subject);
        } catch (Exception e) {
            // Log but don't crash — email is a secondary concern
            log.warn("❌ Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    // ── HTML template builder ────────────────────────────────────────────────
    private String buildHtml(String heading, String message, String footer, String accentColor) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <div style="max-width:520px;margin:32px auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <!-- Header -->
                <div style="background:%s;padding:24px 32px;">
                  <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">🎓 Campus Placement Portal</h1>
                </div>
                <!-- Body -->
                <div style="padding:32px;">
                  <h2 style="margin:0 0 16px;color:#1e293b;font-size:16px;font-weight:600;">%s</h2>
                  <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">%s</p>
                  <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">%s</p>
                </div>
                <!-- Footer -->
                <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;color:#94a3b8;font-size:11px;">This is an automated email from the Campus Placement System. Please do not reply.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(accentColor, heading, message, footer);
    }
}
