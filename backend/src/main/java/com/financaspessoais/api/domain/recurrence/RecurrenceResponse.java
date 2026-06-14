package com.financaspessoais.api.domain.recurrence;

import com.financaspessoais.api.domain.transaction.TransactionType;
import java.math.BigDecimal;
import java.util.UUID;

public record RecurrenceResponse(
    UUID id,
    UUID accountId,
    String description,
    String category,
    TransactionType transactionType,
    BigDecimal amount,
    Integer dayOfMonth,
    boolean active
) {
  public static RecurrenceResponse from(RecurrenceEntity entity) {
    return new RecurrenceResponse(
        entity.getId(),
        entity.getAccount() != null ? entity.getAccount().getId() : null,
        entity.getDescription(),
        entity.getCategory(),
        entity.getTransactionType(),
        entity.getAmount(),
        entity.getDayOfMonth(),
        entity.isActive());
  }
}
