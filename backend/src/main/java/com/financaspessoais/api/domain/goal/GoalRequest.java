package com.financaspessoais.api.domain.goal;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalRequest(
    @NotBlank(message = "Nome é obrigatório")
    String name,

    @NotBlank(message = "Descrição é obrigatória")
    String description,

    @NotNull(message = "Valor alvo é obrigatório")
    @PositiveOrZero(message = "Valor alvo não pode ser negativo")
    BigDecimal targetAmount,

    @NotNull(message = "Valor atual é obrigatório")
    @PositiveOrZero(message = "Valor atual não pode ser negativo")
    BigDecimal currentAmount,

    @NotNull(message = "Prazo é obrigatório")
    @FutureOrPresent(message = "Prazo deve ser hoje ou uma data futura")
    LocalDate dueDate
) {}

