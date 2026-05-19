package shrenikcom.example.campusPlacementSystem.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import shrenikcom.example.campusPlacementSystem.dto.ChangePasswordRequest;
import shrenikcom.example.campusPlacementSystem.dto.ResetPasswordRequest;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // ── Change Password (authenticated user) ─────────────────────────────────
    public String changePassword(ChangePasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with this email"));

        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Prevent same password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", user.getEmail());
        return "Password changed successfully";
    }

    // ── Forgot Password — Step 1: Generate & send reset token ────────────────
    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        // Generate secure token
        String token = UUID.randomUUID().toString();

        // Set token + 15 minute expiry
        user.setResetToken(token);
        user.setTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        // Build reset link
        String resetLink = "http://localhost:5173/reset-password?token=" + token;

        // Send email with reset link
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink);

        log.info("Password reset email sent to: {}", email);
        return "Password reset link sent to your email";
    }

    // ── Reset Password — Step 2: Validate token & update password ────────────
    public String resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        // Check expiry
        if (user.getTokenExpiry() == null || user.getTokenExpiry().isBefore(LocalDateTime.now())) {
            // Clear expired token
            user.setResetToken(null);
            user.setTokenExpiry(null);
            userRepository.save(user);
            throw new RuntimeException("Reset token has expired. Please request a new one.");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        // Clear token after use (one-time use)
        user.setResetToken(null);
        user.setTokenExpiry(null);
        userRepository.save(user);

        log.info("Password reset successfully for user: {}", user.getEmail());
        return "Password reset successfully. You can now login with your new password.";
    }
}
