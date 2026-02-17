package com.financaspessoais.api.domain.card;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.UUID;

public record CardRequest(
    UUID accountId,

    @NotBlank(message = "Nome é obrigatório")
    String name,

    @NotBlank(message = "Bandeira é obrigatória")
    String brand,

    @Pattern(regexp = "\\d{4}", message = "Últimos 4 dígitos inválidos")
    String lastFour,

    @NotNull(message = "Limite é obrigatório")
    @Positive(message = "Limite deve ser positivo")
    BigDecimal creditLimit,

    @NotNull(message = "Limite usado é obrigatório")
    BigDecimal usedLimit,

    @NotNull(message = "Dia de vencimento é obrigatório")
    @Min(value = 1)
    @Max(value = 31)
    Integer dueDay,

    boolean blocked
) {}
