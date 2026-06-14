package com.financaspessoais.api.domain.card;

import com.financaspessoais.api.domain.transaction.TransactionResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Fatura computada de um cartão num ciclo (não persistida). */
public record InvoiceResponse(
    UUID cardId,
    String month,
    LocalDate periodStart,
    LocalDate periodEnd,
    LocalDate dueDate,
    BigDecimal total,
    List<TransactionResponse> transactions
) {}
