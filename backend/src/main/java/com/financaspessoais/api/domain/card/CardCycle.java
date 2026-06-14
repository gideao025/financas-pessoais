package com.financaspessoais.api.domain.card;

import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Matemática do ciclo de fatura do cartão.
 *
 * <p>Cada fatura é identificada pelo mês em que ela <b>fecha</b> ({@link YearMonth}). A fatura que
 * fecha no mês {@code ym} cobre as compras do dia seguinte ao fechamento anterior até o dia de
 * fechamento de {@code ym} (inclusive), e vence no próximo {@code dueDay} a partir do fechamento.
 */
final class CardCycle {

  private CardCycle() {}

  /** Trunca o dia escolhido ao último dia válido do mês (ex.: fechamento 31 em fevereiro). */
  private static LocalDate dayOf(YearMonth ym, int day) {
    return ym.atDay(Math.min(day, ym.lengthOfMonth()));
  }

  /** Mês em que fecha a fatura de uma compra feita em {@code date}. */
  static YearMonth invoiceMonthFor(LocalDate date, int closingDay) {
    YearMonth ym = YearMonth.from(date);
    return date.isAfter(dayOf(ym, closingDay)) ? ym.plusMonths(1) : ym;
  }

  /** Data de fechamento da fatura que fecha em {@code ym}. */
  static LocalDate closeDate(YearMonth ym, int closingDay) {
    return dayOf(ym, closingDay);
  }

  /** Primeiro dia coberto pela fatura que fecha em {@code ym} (dia seguinte ao fechamento anterior). */
  static LocalDate periodStart(YearMonth ym, int closingDay) {
    return dayOf(ym.minusMonths(1), closingDay).plusDays(1);
  }

  /** Vencimento: próximo {@code dueDay} a partir do fechamento (mesmo mês se cair depois, senão o seguinte). */
  static LocalDate dueDate(YearMonth ym, int closingDay, int dueDay) {
    LocalDate close = closeDate(ym, closingDay);
    LocalDate candidate = dayOf(ym, dueDay);
    return candidate.isAfter(close) ? candidate : dayOf(ym.plusMonths(1), dueDay);
  }
}
