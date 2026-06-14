package com.financaspessoais.api.domain.recurrence;

import com.financaspessoais.api.domain.transaction.TransactionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.UUID;

public record RecurrenceRequest(
    UUID accountId,

    @NotBlank(message = "Descrição é obrigatória")
    String description,

    @NotBlank(message = "Categoria é obrigatória")
    String category,

    @NotNull(message = "Tipo é obrigatório")
    TransactionType transactionType,

    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    BigDecimal amount,

    @NotNull(message = "Dia do mês é obrigatório")
    @Min(value = 1)
    @Max(value = 31)
    Integer dayOfMonth,

    boolean active
) {}
