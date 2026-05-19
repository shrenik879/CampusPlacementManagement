package shrenikcom.example.campusPlacementSystem.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import shrenikcom.example.campusPlacementSystem.dto.AuthResponse;
import shrenikcom.example.campusPlacementSystem.dto.LoginRequest;
import shrenikcom.example.campusPlacementSystem.dto.RegisterRequest;
import shrenikcom.example.campusPlacementSystem.dto.UserResponse;
import shrenikcom.example.campusPlacementSystem.entity.Role;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.repository.UserRepository;
import shrenikcom.example.campusPlacementSystem.security.JwtUtil;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    // ── Login ────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        if (user.getRole() == Role.COMPANY && !Boolean.TRUE.equals(user.getApproved())) {
            throw new RuntimeException("Company not approved by admin");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .resumeUrl(user.getResumeUrl())
                .approved(user.getApproved())
                .skills(user.getSkills())
                .build();

        return AuthResponse.builder()
                .token(token)
                .message("Login successful")
                .user(userResponse)
                .build();
    }

    // ── Register ─────────────────────────────────────────────────────────────
    public UserResponse register(RegisterRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new RuntimeException("Missing required fields");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .approved(false)
                .build();

        User saved = userRepository.save(user);

        return UserResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .resumeUrl(saved.getResumeUrl())
                .build();
    }
}
