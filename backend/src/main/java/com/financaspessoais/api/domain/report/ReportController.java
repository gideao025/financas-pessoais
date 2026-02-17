package com.financaspessoais.api.domain.report;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

  private final ReportService reportService;

  @GetMapping("/dashboard-summary")
  public DashboardSummaryResponse dashboardSummary() {
    return reportService.dashboardSummary();
  }
}
