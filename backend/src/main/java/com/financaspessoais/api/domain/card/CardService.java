package com.financaspessoais.api.domain.card;

import com.financaspessoais.api.common.BusinessException;
import com.financaspessoais.api.domain.account.AccountEntity;
import com.financaspessoais.api.domain.account.AccountRepository;
import com.financaspessoais.api.domain.transaction.TransactionRepository;
import com.financaspessoais.api.domain.transaction.TransactionType;
import com.financaspessoais.api.domain.user.UserEntity;
import com.financaspessoais.api.domain.user.UserRepository;
import com.financaspessoais.api.security.SecurityContextService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CardService {

  private final CardRepository cardRepository;
  private final AccountRepository accountRepository;
  private final TransactionRepository transactionRepository;
  private final UserRepository userRepository;
  private final SecurityContextService securityContextService;

  public List<CardResponse> listMine() {
    UUID userId = securityContextService.getUserId();
    return cardRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(card -> toResponse(card, userId))
        .toList();
  }

  @Transactional
  public CardResponse create(CardRequest request) {
    UUID userId = securityContextService.getUserId();
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));

    AccountEntity account = resolveAccount(request.accountId(), userId);

    LocalDateTime now = LocalDateTime.now();
    CardEntity entity = CardEntity.builder()
        .id(UUID.randomUUID())
        .user(user)
        .account(account)
        .name(request.name())
        .brand(request.brand())
        .lastFour(request.lastFour())
        .creditLimit(request.creditLimit())
        .usedLimit(BigDecimal.ZERO)
        .dueDay(request.dueDay())
        .closingDay(request.closingDay())
        .blocked(request.blocked())
        .createdAt(now)
        .updatedAt(now)
        .build();

    return toResponse(cardRepository.save(entity), userId);
  }

  @Transactional
  public CardResponse update(UUID cardId, CardRequest request) {
    UUID userId = securityContextService.getUserId();
    CardEntity entity = cardRepository.findByIdAndUserId(cardId, userId)
        .orElseThrow(() -> new BusinessException("Cartão não encontrado", HttpStatus.NOT_FOUND));

    entity.setAccount(resolveAccount(request.accountId(), userId));
    entity.setName(request.name());
    entity.setBrand(request.brand());
    entity.setLastFour(request.lastFour());
    entity.setCreditLimit(request.creditLimit());
    entity.setDueDay(request.dueDay());
    entity.setClosingDay(request.closingDay());
    entity.setBlocked(request.blocked());
    entity.setUpdatedAt(LocalDateTime.now());

    return toResponse(cardRepository.save(entity), userId);
  }

  @Transactional
  public CardResponse toggleBlocked(UUID cardId) {
    UUID userId = securityContextService.getUserId();
    CardEntity entity = cardRepository.findByIdAndUserId(cardId, userId)
        .orElseThrow(() -> new BusinessException("Cartão não encontrado", HttpStatus.NOT_FOUND));

    entity.setBlocked(!entity.isBlocked());
    entity.setUpdatedAt(LocalDateTime.now());
    return toResponse(cardRepository.save(entity), userId);
  }

  private AccountEntity resolveAccount(UUID accountId, UUID userId) {
    if (accountId == null) {
      return null;
    }
    return accountRepository.findByIdAndUserId(accountId, userId)
        .orElseThrow(() -> new BusinessException("Conta não encontrada", HttpStatus.NOT_FOUND));
  }

  /** Monta o response calculando o limite usado (fatura aberta + parcelas futuras). */
  private CardResponse toResponse(CardEntity card, UUID userId) {
    YearMonth openInvoice = CardCycle.invoiceMonthFor(LocalDate.now(), card.getClosingDay());
    LocalDate from = CardCycle.periodStart(openInvoice, card.getClosingDay());
    BigDecimal used = transactionRepository.sumCardSince(userId, card.getId(), TransactionType.SAIDA, from);
    return CardResponse.from(card, used);
  }
}
