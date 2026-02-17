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
    Integer dueDay,
    boolean blocked
) {
  public static CardResponse from(CardEntity entity) {
    return new CardResponse(
        entity.getId(),
        entity.getAccount() != null ? entity.getAccount().getId() : null,
        entity.getName(),
        entity.getBrand(),
        entity.getLastFour(),
        entity.getCreditLimit(),
        entity.getUsedLimit(),
        entity.getDueDay(),
        entity.isBlocked());
  }
}
