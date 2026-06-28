package shrenikcom.example.campusPlacementSystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import shrenikcom.example.campusPlacementSystem.dto.*;
import shrenikcom.example.campusPlacementSystem.service.AuthService;
import shrenikcom.example.campusPlacementSystem.service.PasswordService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, and password management endpoints. No JWT required.")
public class AuthController {

    private final AuthService authService;
    private final PasswordService passwordService;

    @Operation(summary = "Login", description = "Authenticate with email and password. Returns a JWT token.")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Register", description = "Create a new STUDENT or COMPANY account.")
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Change Password", description = "Change password for the currently authenticated user.")
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String message = passwordService.changePassword(request);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @Operation(summary = "Forgot Password", description = "Send a password reset link to the given email address.")
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String message = passwordService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of("message", message));
    }

    @Operation(summary = "Reset Password", description = "Reset password using the token received in the reset email.")
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String message = passwordService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", message));
    }
}
