package com.financaspessoais.api.domain.transaction;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<TransactionEntity, UUID> {
  List<TransactionEntity> findByUserIdOrderByTransactionDateDesc(UUID userId);
  List<TransactionEntity> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(UUID userId, LocalDate from, LocalDate to);
  Optional<TransactionEntity> findByIdAndUserId(UUID id, UUID userId);
}
