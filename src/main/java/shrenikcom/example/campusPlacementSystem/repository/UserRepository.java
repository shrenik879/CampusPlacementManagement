package shrenikcom.example.campusPlacementSystem.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import shrenikcom.example.campusPlacementSystem.entity.Role;
import shrenikcom.example.campusPlacementSystem.entity.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    long countByRole(Role role);

    // Find companies by approval status
    List<User> findByRoleAndApproved(Role role, Boolean approved);

    // Find blocked users
    List<User> findByBlocked(Boolean blocked);

    // Paginated findAll (used by admin)
    Page<User> findAll(Pageable pageable);
}
