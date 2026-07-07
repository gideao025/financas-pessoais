package com.financaspessoais.api.domain.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponse(
    UUID id,
    UUID accountId,
    UUID cardId,
    String description,
    String category,
    TransactionType transactionType,
    TransactionStatus status,
    BigDecimal amount,
    BigDecimal paidAmount,
    LocalDate transactionDate,
    UUID recurrenceId,
    LocalDate dueDate,
    Integer installmentNumber,
    Integer installmentTotal
) {
  public static TransactionResponse from(TransactionEntity entity) {
    return new TransactionResponse(
        entity.getId(),
        entity.getAccount() != null ? entity.getAccount().getId() : null,
        entity.getCard() != null ? entity.getCard().getId() : null,
        entity.getDescription(),
        entity.getCategory(),
        entity.getTransactionType(),
        entity.getStatus(),
        entity.getAmount(),
        entity.getPaidAmount(),
        entity.getTransactionDate(),
        entity.getRecurrenceId(),
        entity.getDueDate(),
        entity.getInstallmentNumber(),
        entity.getInstallmentTotal());
  }
}
