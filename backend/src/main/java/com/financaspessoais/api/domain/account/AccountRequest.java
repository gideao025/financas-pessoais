package com.financaspessoais.api.domain.account;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record AccountRequest(
    @NotBlank(message = "Nome é obrigatório")
    String name,

    @NotNull(message = "Tipo é obrigatório")
    AccountType type,

    @NotBlank(message = "Instituição é obrigatória")
    String institution,

    @NotNull(message = "Saldo é obrigatório")
    @PositiveOrZero(message = "Saldo não pode ser negativo")
    BigDecimal balance,

    boolean active
) {}
