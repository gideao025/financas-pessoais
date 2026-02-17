package com.financaspessoais.api.domain.report;

import com.financaspessoais.api.domain.transaction.TransactionEntity;
import com.financaspessoais.api.domain.transaction.TransactionRepository;
import com.financaspessoais.api.domain.transaction.TransactionStatus;
import com.financaspessoais.api.domain.transaction.TransactionType;
import com.financaspessoais.api.security.SecurityContextService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportService {

  private final TransactionRepository transactionRepository;
  private final SecurityContextService securityContextService;

  public DashboardSummaryResponse dashboardSummary() {
    UUID userId = securityContextService.getUserId();
    List<TransactionEntity> transactions = transactionRepository.findByUserIdOrderByTransactionDateDesc(userId);

    BigDecimal income = sumByType(transactions, TransactionType.ENTRADA);
    BigDecimal expense = sumByType(transactions, TransactionType.SAIDA);

    long pending = transactions.stream().filter(t -> t.getStatus() == TransactionStatus.PENDENTE).count();
    long completed = transactions.stream().filter(t -> t.getStatus() == TransactionStatus.CONCLUIDA).count();

    LocalDate from = LocalDate.now().minusMonths(5).withDayOfMonth(1);
    List<TransactionEntity> lastSix = transactions.stream()
        .filter(t -> !t.getTransactionDate().isBefore(from))
        .toList();

    Map<String, List<TransactionEntity>> grouped = lastSix.stream()
        .collect(Collectors.groupingBy(t -> t.getTransactionDate().getYear() + "-" + t.getTransactionDate().getMonthValue()));

    List<MonthlyReportItem> series = grouped.entrySet().stream()
        .map(entry -> {
          List<TransactionEntity> items = entry.getValue();
          BigDecimal monthIncome = sumByType(items, TransactionType.ENTRADA);
          BigDecimal monthExpense = sumByType(items, TransactionType.SAIDA);
          LocalDate anyDate = items.getFirst().getTransactionDate();
          String month = anyDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("pt-BR"));
          return new MonthlyReportItem(month, monthIncome, monthExpense, monthIncome.subtract(monthExpense));
        })
        .sorted(Comparator.comparing(MonthlyReportItem::month))
        .toList();

    return new DashboardSummaryResponse(income, expense, income.subtract(expense), pending, completed, series);
  }

  private BigDecimal sumByType(List<TransactionEntity> transactions, TransactionType type) {
    return transactions.stream()
        .filter(t -> t.getTransactionType() == type)
        .map(TransactionEntity::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }
}
