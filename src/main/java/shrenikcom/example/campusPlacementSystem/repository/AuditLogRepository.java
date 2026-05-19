package shrenikcom.example.campusPlacementSystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shrenikcom.example.campusPlacementSystem.entity.AuditLog;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByTimestampDesc();
}
