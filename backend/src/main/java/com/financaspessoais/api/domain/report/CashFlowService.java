package com.financaspessoais.api.domain.report;

import com.financaspessoais.api.domain.account.AccountEntity;
import com.financaspessoais.api.domain.account.AccountRepository;
import com.financaspessoais.api.domain.card.CardCycle;
import com.financaspessoais.api.domain.card.CardEntity;
import com.financaspessoais.api.domain.card.CardRepository;
import com.financaspessoais.api.domain.recurrence.RecurrenceEntity;
import com.financaspessoais.api.domain.recurrence.RecurrenceRepository;
import com.financaspessoais.api.domain.report.CashFlowResponse.CardProvision;
import com.financaspessoais.api.domain.report.CashFlowResponse.DailyPoint;
import com.financaspessoais.api.domain.report.CashFlowResponse.FlowEvent;
import com.financaspessoais.api.domain.report.CashFlowResponse.MinPoint;
import com.financaspessoais.api.domain.transaction.TransactionEntity;
import com.financaspessoais.api.domain.transaction.TransactionRepository;
import com.financaspessoais.api.domain.transaction.TransactionType;
import com.financaspessoais.api.security.SecurityContextService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CashFlowService {

  private final AccountRepository accountRepository;
  private final RecurrenceRepository recurrenceRepository;
  private final CardRepository cardRepository;
  private final TransactionRepository transactionRepository;
  private final SecurityContextService securityContextService;

  public CashFlowResponse cashFlow(int days) {
    int horizon = Math.max(1, Math.min(days, 365));
    UUID userId = securityContextService.getUserId();
    LocalDate today = LocalDate.now();
    LocalDate end = today.plusDays(horizon);

    BigDecimal startBalance = accountRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(AccountEntity::getBalance)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    // eventos por dia (ordenados); valores assinados: + entrada, - saída
    Map<LocalDate, List<FlowEvent>> eventsByDay = new TreeMap<>();

    collectFutureTransactions(userId, today, end, eventsByDay);
    collectRecurrences(userId, today, end, eventsByDay);
    List<CardProvision> cards = collectCardInvoicesAndProvision(userId, today, end, eventsByDay);

    // caminha dia-a-dia
    List<DailyPoint> series = new ArrayList<>();
    BigDecimal running = startBalance;
    MinPoint min = new MinPoint(today, startBalance);
    for (LocalDate d = today; !d.isAfter(end); d = d.plusDays(1)) {
      List<FlowEvent> events = eventsByDay.getOrDefault(d, List.of());
      BigDecimal inflow = BigDecimal.ZERO;
      BigDecimal outflow = BigDecimal.ZERO;
      for (FlowEvent e : events) {
        if (e.amount().signum() >= 0) {
          inflow = inflow.add(e.amount());
        } else {
          outflow = outflow.add(e.amount().negate());
        }
      }
      running = running.add(inflow).subtract(outflow);
      series.add(new DailyPoint(d, inflow, outflow, running, events));
      if (running.compareTo(min.balance()) < 0) {
        min = new MinPoint(d, running);
      }
    }

    return new CashFlowResponse(startBalance, today, end, series, min, cards);
  }

  /** Transações com data futura que NÃO são de cartão (as de cartão entram via fatura no vencimento). */
  private void collectFutureTransactions(UUID userId, LocalDate today, LocalDate end,
      Map<LocalDate, List<FlowEvent>> eventsByDay) {
    transactionRepository
        .findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(userId, today.plusDays(1), end)
        .stream()
        .filter(t -> t.getCard() == null)
        .forEach(t -> {
          boolean entrada = t.getTransactionType() == TransactionType.ENTRADA;
          addEvent(eventsByDay, t.getTransactionDate(),
              new FlowEvent(entrada ? "RECEITA" : "DESPESA", t.getDescription(), signed(t.getAmount(), entrada)));
        });
  }

  /** Recorrências ativas expandidas no dia do mês, dentro do horizonte. */
  private void collectRecurrences(UUID userId, LocalDate today, LocalDate end,
      Map<LocalDate, List<FlowEvent>> eventsByDay) {
    List<RecurrenceEntity> recs = recurrenceRepository.findByUserIdAndActiveTrue(userId);
    for (YearMonth ym = YearMonth.from(today); !ym.isAfter(YearMonth.from(end)); ym = ym.plusMonths(1)) {
      for (RecurrenceEntity r : recs) {
        LocalDate date = ym.atDay(Math.min(r.getDayOfMonth(), ym.lengthOfMonth()));
        if (date.isAfter(today) && !date.isAfter(end)) {
          boolean entrada = r.getTransactionType() == TransactionType.ENTRADA;
          addEvent(eventsByDay, date,
              new FlowEvent(entrada ? "RECEITA" : "DESPESA", r.getDescription(), signed(r.getAmount(), entrada)));
        }
      }
    }
  }

  /** Para cada cartão: fatura a vencer no horizonte vira saída no vencimento; monta a provisão (limite/próxima fatura). */
  private List<CardProvision> collectCardInvoicesAndProvision(UUID userId, LocalDate today, LocalDate end,
      Map<LocalDate, List<FlowEvent>> eventsByDay) {
    List<CardProvision> provisions = new ArrayList<>();
    for (CardEntity card : cardRepository.findByUserIdOrderByCreatedAtDesc(userId)) {
      int closing = card.getClosingDay();
      int due = card.getDueDay();

      // limite usado = fatura aberta + parcelas futuras (mesma base da tela de cartão)
      LocalDate openStart = CardCycle.periodStart(CardCycle.invoiceMonthFor(today, closing), closing);
      BigDecimal used = transactionRepository.sumCardSince(userId, card.getId(), TransactionType.SAIDA, openStart);
      BigDecimal available = card.getCreditLimit().subtract(used);

      // varre ciclos cujo vencimento ainda não passou; gera saída para os que vencem no horizonte
      LocalDate nextDue = null;
      BigDecimal nextTotal = null;
      YearMonth from = YearMonth.from(today).minusMonths(1);
      YearMonth to = YearMonth.from(end).plusMonths(1);
      for (YearMonth ym = from; !ym.isAfter(to); ym = ym.plusMonths(1)) {
        LocalDate dueDate = CardCycle.dueDate(ym, closing, due);
        if (dueDate.isBefore(today)) {
          continue;
        }
        BigDecimal total = sumCardPeriod(userId, card.getId(),
            CardCycle.periodStart(ym, closing), CardCycle.closeDate(ym, closing));
        if (nextDue == null) {
          nextDue = dueDate;
          nextTotal = total;
        }
        if (dueDate.isAfter(today) && !dueDate.isAfter(end) && total.signum() > 0) {
          addEvent(eventsByDay, dueDate, new FlowEvent("FATURA", "Fatura " + card.getName(), total.negate()));
        }
      }

      provisions.add(new CardProvision(card.getId(), card.getName(), card.getCreditLimit(),
          used, available, nextDue, nextTotal != null ? nextTotal : BigDecimal.ZERO));
    }
    return provisions;
  }

  private BigDecimal sumCardPeriod(UUID userId, UUID cardId, LocalDate from, LocalDate to) {
    return transactionRepository
        .findByUserIdAndCardIdAndTransactionDateBetweenOrderByTransactionDateDesc(userId, cardId, from, to)
        .stream()
        .filter(t -> t.getTransactionType() == TransactionType.SAIDA)
        .map(TransactionEntity::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private BigDecimal signed(BigDecimal amount, boolean entrada) {
    return entrada ? amount : amount.negate();
  }

  private void addEvent(Map<LocalDate, List<FlowEvent>> eventsByDay, LocalDate date, FlowEvent event) {
    eventsByDay.computeIfAbsent(date, k -> new ArrayList<>()).add(event);
  }
}
