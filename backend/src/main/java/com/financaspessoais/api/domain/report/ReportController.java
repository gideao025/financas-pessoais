package com.financaspessoais.api.domain.report;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

  private final ReportService reportService;
  private final CashFlowService cashFlowService;

  @GetMapping("/dashboard-summary")
  public DashboardSummaryResponse dashboardSummary() {
    return reportService.dashboardSummary();
  }

  @GetMapping("/cash-flow")
  public CashFlowResponse cashFlow(@RequestParam(defaultValue = "90") int days) {
    return cashFlowService.cashFlow(days);
  }

  @GetMapping("/by-category")
  public List<CategoryReportItem> byCategory(@RequestParam(required = false) String month) {
    return reportService.expensesByCategory(month);
  }
}
