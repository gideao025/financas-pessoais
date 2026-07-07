package com.financaspessoais.api.domain.report;

import java.math.BigDecimal;

public record CategoryReportItem(
    String category,
    BigDecimal total
) {}
