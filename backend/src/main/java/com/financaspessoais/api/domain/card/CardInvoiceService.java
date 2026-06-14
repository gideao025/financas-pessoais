package com.financaspessoais.api.domain.card;

import com.financaspessoais.api.common.BusinessException;
import com.financaspessoais.api.domain.transaction.TransactionEntity;
import com.financaspessoais.api.domain.transaction.TransactionRepository;
import com.financaspessoais.api.domain.transaction.TransactionResponse;
import com.financaspessoais.api.domain.transaction.TransactionType;
import com.financaspessoais.api.security.SecurityContextService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CardInvoiceService {

  private final CardRepository cardRepository;
  private final TransactionRepository transactionRepository;
  private final SecurityContextService securityContextService;

  /** Fatura atualmente aberta (a que vai fechar a seguir). */
  public InvoiceResponse getCurrentInvoice(UUID cardId) {
    CardEntity card = requireCard(cardId);
    YearMonth month = CardCycle.invoiceMonthFor(LocalDate.now(), card.getClosingDay());
    return buildInvoice(card, month);
  }

  /** Fatura que fecha no mês informado. */
  public InvoiceResponse getInvoice(UUID cardId, YearMonth month) {
    CardEntity card = requireCard(cardId);
    return buildInvoice(card, month);
  }

  private CardEntity requireCard(UUID cardId) {
    UUID userId = securityContextService.getUserId();
    return cardRepository.findByIdAndUserId(cardId, userId)
        .orElseThrow(() -> new BusinessException("Cartão não encontrado", HttpStatus.NOT_FOUND));
  }

  private InvoiceResponse buildInvoice(CardEntity card, YearMonth month) {
    UUID userId = securityContextService.getUserId();
    int closingDay = card.getClosingDay();
    LocalDate start = CardCycle.periodStart(month, closingDay);
    LocalDate end = CardCycle.closeDate(month, closingDay);
    LocalDate due = CardCycle.dueDate(month, closingDay, card.getDueDay());

    List<TransactionEntity> entities = transactionRepository
        .findByUserIdAndCardIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            userId, card.getId(), start, end);

    BigDecimal total = entities.stream()
        .filter(t -> t.getTransactionType() == TransactionType.SAIDA)
        .map(TransactionEntity::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    List<TransactionResponse> transactions = entities.stream().map(TransactionResponse::from).toList();

    return new InvoiceResponse(card.getId(), month.toString(), start, end, due, total, transactions);
  }
}
