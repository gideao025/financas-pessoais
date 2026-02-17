package com.financaspessoais.api.domain.card;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardRepository extends JpaRepository<CardEntity, UUID> {
  List<CardEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
  Optional<CardEntity> findByIdAndUserId(UUID id, UUID userId);
}
