package shrenikcom.example.campusPlacementSystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shrenikcom.example.campusPlacementSystem.entity.Application;
import shrenikcom.example.campusPlacementSystem.entity.Round;

import java.util.List;

public interface RoundRepository extends JpaRepository<Round, Long> {

    // Get all rounds for an application, ordered by roundOrder
    List<Round> findByApplicationOrderByRoundOrderAsc(Application application);

    // Check if rounds already exist for an application
    boolean existsByApplication(Application application);

    // Delete all rounds for an application
    void deleteByApplication(Application application);
}
