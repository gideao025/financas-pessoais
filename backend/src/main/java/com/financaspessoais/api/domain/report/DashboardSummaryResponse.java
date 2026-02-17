package com.financaspessoais.api.domain.report;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
    BigDecimal totalIncome,
    BigDecimal totalExpense,
    BigDecimal balance,
    long pendingCount,
    long completedCount,
    List<MonthlyReportItem> monthlySeries
) {}
