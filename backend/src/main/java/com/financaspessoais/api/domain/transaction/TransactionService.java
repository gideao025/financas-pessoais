package com.financaspessoais.api.domain.transaction;

import com.financaspessoais.api.common.BusinessException;
import com.financaspessoais.api.domain.account.AccountEntity;
import com.financaspessoais.api.domain.account.AccountRepository;
import com.financaspessoais.api.domain.card.CardEntity;
import com.financaspessoais.api.domain.card.CardRepository;
import com.financaspessoais.api.domain.user.UserEntity;
import com.financaspessoais.api.domain.user.UserRepository;
import com.financaspessoais.api.security.SecurityContextService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransactionService {

  private final TransactionRepository transactionRepository;
  private final AccountRepository accountRepository;
  private final CardRepository cardRepository;
  private final UserRepository userRepository;
  private final SecurityContextService securityContextService;

  public List<TransactionResponse> listMine(LocalDate from, LocalDate to) {
    UUID userId = securityContextService.getUserId();

    List<TransactionEntity> entities;
    if (from != null && to != null) {
      entities = transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(userId, from, to);
    } else {
      entities = transactionRepository.findByUserIdOrderByTransactionDateDesc(userId);
    }

    return entities.stream().map(TransactionResponse::from).toList();
  }

  @Transactional
  public TransactionResponse create(TransactionRequest request) {
    UUID userId = securityContextService.getUserId();
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));

    AccountEntity account = null;
    if (request.accountId() != null) {
      account = accountRepository.findByIdAndUserId(request.accountId(), userId)
          .orElseThrow(() -> new BusinessException("Conta não encontrada", HttpStatus.NOT_FOUND));
    }

    CardEntity card = null;
    if (request.cardId() != null) {
      card = cardRepository.findByIdAndUserId(request.cardId(), userId)
          .orElseThrow(() -> new BusinessException("Cartão não encontrado", HttpStatus.NOT_FOUND));
    }

    int installments = request.installmentTotal() != null ? request.installmentTotal() : 1;
    if (installments > 1) {
      if (card == null) {
        throw new BusinessException("Parcelamento exige um cartão", HttpStatus.BAD_REQUEST);
      }
      return createInstallments(user, account, card, request, installments);
    }

    LocalDateTime now = LocalDateTime.now();
    TransactionEntity entity = TransactionEntity.builder()
        .id(UUID.randomUUID())
        .user(user)
        .account(account)
        .card(card)
        .description(request.description())
        .category(request.category())
        .transactionType(request.transactionType())
        .status(request.status())
        .amount(request.amount())
        .transactionDate(request.transactionDate())
        .createdAt(now)
        .updatedAt(now)
        .build();

    return TransactionResponse.from(transactionRepository.save(entity));
  }

  /**
   * Expande uma compra parcelada em N transações (uma por ciclo de fatura consecutivo), ligadas por
   * um {@code installmentGroupId}. {@code amount} do request é o valor TOTAL da compra; cada parcela
   * recebe total/N, e o eventual resto de centavos vai na primeira. Retorna a parcela 1/N.
   */
  private TransactionResponse createInstallments(
      UserEntity user, AccountEntity account, CardEntity card, TransactionRequest request, int n) {
    LocalDateTime now = LocalDateTime.now();
    UUID groupId = UUID.randomUUID();

    BigDecimal per = request.amount().divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
    BigDecimal remainder = request.amount().subtract(per.multiply(BigDecimal.valueOf(n)));

    List<TransactionEntity> parcels = new ArrayList<>(n);
    for (int i = 0; i < n; i++) {
      BigDecimal amount = i == 0 ? per.add(remainder) : per;
      parcels.add(TransactionEntity.builder()
          .id(UUID.randomUUID())
          .user(user)
          .account(account)
          .card(card)
          .description("%s (%d/%d)".formatted(request.description(), i + 1, n))
          .category(request.category())
          .transactionType(request.transactionType())
          .status(request.status())
          .amount(amount)
          .transactionDate(request.transactionDate().plusMonths(i))
          .installmentGroupId(groupId)
          .installmentNumber(i + 1)
          .installmentTotal(n)
          .createdAt(now)
          .updatedAt(now)
          .build());
    }

    List<TransactionEntity> saved = transactionRepository.saveAll(parcels);
    return TransactionResponse.from(saved.get(0));
  }

  @Transactional
  public void delete(UUID id) {
    UUID userId = securityContextService.getUserId();
    TransactionEntity entity = transactionRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new BusinessException("Transação não encontrada", HttpStatus.NOT_FOUND));

    // apagar uma parcela remove a compra parcelada inteira
    if (entity.getInstallmentGroupId() != null) {
      transactionRepository.deleteAll(
          transactionRepository.findByInstallmentGroupIdAndUserId(entity.getInstallmentGroupId(), userId));
      return;
    }
    transactionRepository.delete(entity);
  }
}
