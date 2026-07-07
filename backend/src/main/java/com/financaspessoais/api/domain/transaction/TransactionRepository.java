package com.financaspessoais.api.domain.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionRepository extends JpaRepository<TransactionEntity, UUID> {
  List<TransactionEntity> findByUserIdOrderByTransactionDateDesc(UUID userId);
  List<TransactionEntity> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(UUID userId, LocalDate from, LocalDate to);
  Optional<TransactionEntity> findByIdAndUserId(UUID id, UUID userId);

  // parcelas de uma mesma compra parcelada
  List<TransactionEntity> findByInstallmentGroupIdAndUserId(UUID installmentGroupId, UUID userId);

  // materialização de recorrências: evita duplicar a conta fixa no mesmo mês
  boolean existsByUserIdAndRecurrenceIdAndCompetence(UUID userId, UUID recurrenceId, String competence);

  // transações originadas de recorrências (para não contar em dobro no cash-flow)
  List<TransactionEntity> findByUserIdAndRecurrenceIdIsNotNull(UUID userId);

  // transações de um cartão dentro de um período (fatura)
  List<TransactionEntity> findByUserIdAndCardIdAndTransactionDateBetweenOrderByTransactionDateDesc(
      UUID userId, UUID cardId, LocalDate from, LocalDate to);

  // soma das saídas de um cartão a partir de uma data (fatura aberta + parcelas futuras = limite comprometido)
  @Query("""
      select coalesce(sum(t.amount), 0) from TransactionEntity t
      where t.user.id = :userId and t.card.id = :cardId
        and t.transactionType = :type and t.transactionDate >= :start""")
  BigDecimal sumCardSince(
      @Param("userId") UUID userId,
      @Param("cardId") UUID cardId,
      @Param("type") TransactionType type,
      @Param("start") LocalDate start);
}
