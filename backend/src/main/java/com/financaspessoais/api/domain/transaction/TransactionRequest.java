package com.financaspessoais.api.domain.transaction;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionRequest(
    UUID accountId,
    UUID cardId,

    @NotBlank(message = "Descrição é obrigatória")
    String description,

    @NotBlank(message = "Categoria é obrigatória")
    String category,

    @NotNull(message = "Tipo é obrigatório")
    TransactionType transactionType,

    @NotNull(message = "Status é obrigatório")
    TransactionStatus status,

    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    BigDecimal amount,

    @NotNull(message = "Data da transação é obrigatória")
    LocalDate transactionDate,

    @Min(value = 1, message = "Número de parcelas inválido")
    @Max(value = 36, message = "Máximo de 36 parcelas")
    Integer installmentTotal
) {}
