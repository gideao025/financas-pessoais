package com.financaspessoais.api.domain.card;

import java.math.BigDecimal;
import java.util.UUID;

public record CardResponse(
    UUID id,
    UUID accountId,
    String name,
    String brand,
    String lastFour,
    BigDecimal creditLimit,
    BigDecimal usedLimit,
    BigDecimal availableLimit,
    Integer dueDay,
    Integer closingDay,
    boolean blocked
) {
  /** {@code usedLimit} é calculado (fatura aberta + parcelas futuras), não persistido. */
  public static CardResponse from(CardEntity entity, BigDecimal usedLimit) {
    BigDecimal available = entity.getCreditLimit().subtract(usedLimit);
    return new CardResponse(
        entity.getId(),
        entity.getAccount() != null ? entity.getAccount().getId() : null,
        entity.getName(),
        entity.getBrand(),
        entity.getLastFour(),
        entity.getCreditLimit(),
        usedLimit,
        available,
        entity.getDueDay(),
        entity.getClosingDay(),
        entity.isBlocked());
  }
}
