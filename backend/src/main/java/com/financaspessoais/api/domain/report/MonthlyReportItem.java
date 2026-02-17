package com.financaspessoais.api.domain.report;

import java.math.BigDecimal;

public record MonthlyReportItem(
    String month,
    BigDecimal income,
    BigDecimal expense,
    BigDecimal savings
) {}
