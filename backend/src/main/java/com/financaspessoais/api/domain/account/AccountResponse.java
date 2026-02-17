package com.financaspessoais.api.domain.account;

import java.math.BigDecimal;
import java.util.UUID;

public record AccountResponse(
    UUID id,
    String name,
    AccountType type,
    String institution,
    BigDecimal balance,
    boolean active
) {
  public static AccountResponse from(AccountEntity entity) {
    return new AccountResponse(
        entity.getId(),
        entity.getName(),
        entity.getType(),
        entity.getInstitution(),
        entity.getBalance(),
        entity.isActive());
  }
}
