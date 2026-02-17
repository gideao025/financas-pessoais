package com.financaspessoais.api.domain.goal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record GoalResponse(
    UUID id,
    String name,
    String description,
    BigDecimal targetAmount,
    BigDecimal currentAmount,
    LocalDate dueDate,
    int progress
) {
  public static GoalResponse from(GoalEntity entity) {
    BigDecimal target = entity.getTargetAmount() == null ? BigDecimal.ZERO : entity.getTargetAmount();
    BigDecimal current = entity.getCurrentAmount() == null ? BigDecimal.ZERO : entity.getCurrentAmount();
    int pct = BigDecimal.ZERO.compareTo(target) == 0
        ? 0
        : current.multiply(BigDecimal.valueOf(100)).divide(target, 0, java.math.RoundingMode.HALF_UP).intValue();

    return new GoalResponse(
        entity.getId(),
        entity.getName(),
        entity.getDescription(),
        entity.getTargetAmount(),
        entity.getCurrentAmount(),
        entity.getDueDate(),
        Math.min(pct, 100));
  }
}

