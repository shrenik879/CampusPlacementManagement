package shrenikcom.example.campusPlacementSystem.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column (nullable=false)
    private String name;

    @Column(nullable = false,unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private  Role role;

    private String resumeUrl;

    @Column(nullable = true, length = 500)
    private String skills; // comma-separated, e.g. "Java, React, SQL"

    @JsonIgnore
    @Column(nullable = false)
    @Builder.Default
    private Boolean approved = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean blocked = false;

    // ── Password Reset ──────────────────────────────────────────────────────
    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "token_expiry")
    private java.time.LocalDateTime tokenExpiry;

}
