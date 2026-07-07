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

  /** Soma das saídas por categoria no mês informado (YYYY-MM); usa o mês corrente se nulo/vazio. */
  public List<CategoryReportItem> expensesByCategory(String month) {
    UUID userId = securityContextService.getUserId();

    LocalDate base = parseMonth(month);
    LocalDate from = base.withDayOfMonth(1);
    LocalDate to = base.withDayOfMonth(base.lengthOfMonth());

    List<TransactionEntity> saidas = transactionRepository
        .findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(userId, from, to)
        .stream()
        .filter(t -> t.getTransactionType() == TransactionType.SAIDA)
        .toList();

    return saidas.stream()
        .collect(Collectors.groupingBy(
            t -> t.getCategory() == null || t.getCategory().isBlank() ? "Sem categoria" : t.getCategory(),
            Collectors.reducing(BigDecimal.ZERO, TransactionEntity::getAmount, BigDecimal::add)))
        .entrySet().stream()
        .map(e -> new CategoryReportItem(e.getKey(), e.getValue()))
        .sorted(Comparator.comparing(CategoryReportItem::total).reversed())
        .toList();
  }

  private LocalDate parseMonth(String month) {
    if (month == null || month.isBlank()) {
      return LocalDate.now();
    }
    try {
      String[] parts = month.split("-");
      return LocalDate.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), 1);
    } catch (RuntimeException ex) {
      return LocalDate.now();
    }
  }

  private BigDecimal sumByType(List<TransactionEntity> transactions, TransactionType type) {
    return transactions.stream()
        .filter(t -> t.getTransactionType() == type)
        .map(TransactionEntity::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }
}
