package com.financaspessoais.api.domain.recurrence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecurrenceRepository extends JpaRepository<RecurrenceEntity, UUID> {
  List<RecurrenceEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
  List<RecurrenceEntity> findByUserIdAndActiveTrue(UUID userId);
  Optional<RecurrenceEntity> findByIdAndUserId(UUID id, UUID userId);
}
