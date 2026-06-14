package com.financaspessoais.api.domain.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Projeção de saldo dia-a-dia (fluxo de caixa futuro). */
public record CashFlowResponse(
    BigDecimal startBalance,
    LocalDate startDate,
    LocalDate endDate,
    List<DailyPoint> days,
    MinPoint minBalance,
    List<CardProvision> cards
) {

  /** Um dia da projeção: entradas, saídas, saldo ao fim do dia e os eventos que o moveram. */
  public record DailyPoint(
      LocalDate date,
      BigDecimal inflow,
      BigDecimal outflow,
      BigDecimal balance,
      List<FlowEvent> events
  ) {}

  /** Evento que movimenta o caixa num dia. type ∈ RECEITA | DESPESA | FATURA. */
  public record FlowEvent(String type, String label, BigDecimal amount) {}

  /** Menor saldo previsto no horizonte (alerta de "vai faltar"). */
  public record MinPoint(LocalDate date, BigDecimal balance) {}

  /** Provisão de um cartão: limite, uso e próxima fatura. */
  public record CardProvision(
      UUID cardId,
      String name,
      BigDecimal creditLimit,
      BigDecimal usedLimit,
      BigDecimal availableLimit,
      LocalDate nextDueDate,
      BigDecimal nextInvoiceTotal
  ) {}
}
