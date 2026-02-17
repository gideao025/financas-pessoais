package com.financaspessoais.api.domain.goal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalRepository extends JpaRepository<GoalEntity, UUID> {
  List<GoalEntity> findByUserIdOrderByUpdatedAtDesc(UUID userId);
  Optional<GoalEntity> findByIdAndUserId(UUID id, UUID userId);
}

