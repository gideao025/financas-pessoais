package com.financaspessoais.api.domain.transaction;

import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/** Corpo opcional do pagamento. amount ausente = quita o valor restante. */
public record PaymentRequest(
    @Positive(message = "Valor do pagamento deve ser positivo")
    BigDecimal amount
) {}
