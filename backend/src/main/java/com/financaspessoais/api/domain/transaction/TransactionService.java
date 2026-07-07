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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        .paidAmount(request.status() == TransactionStatus.CONCLUIDA ? request.amount() : BigDecimal.ZERO)
        .transactionDate(request.transactionDate())
        .createdAt(now)
        .updatedAt(now)
        .build();

    TransactionResponse saved = TransactionResponse.from(transactionRepository.save(entity));
    // reflete no saldo da conta (débito/crédito) quando já realizada
    Map<UUID, BigDecimal> deltas = new HashMap<>();
    accumulate(deltas, entity, BigDecimal.ONE);
    applyBalanceDeltas(userId, deltas);
    return saved;
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
          .paidAmount(request.status() == TransactionStatus.CONCLUIDA ? amount : BigDecimal.ZERO)
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
  public TransactionResponse update(UUID id, TransactionRequest request) {
    UUID userId = securityContextService.getUserId();
    TransactionEntity entity = transactionRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new BusinessException("Transação não encontrada", HttpStatus.NOT_FOUND));

    // parcelas de uma compra parcelada não são editáveis individualmente
    if (entity.getInstallmentGroupId() != null) {
      throw new BusinessException(
          "Compras parceladas não podem ser editadas. Exclua o grupo e lance novamente.",
          HttpStatus.BAD_REQUEST);
    }

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

    // reverte o efeito antigo no saldo antes de mutar a transação
    Map<UUID, BigDecimal> deltas = new HashMap<>();
    accumulate(deltas, entity, BigDecimal.ONE.negate());

    entity.setAccount(account);
    entity.setCard(card);
    entity.setDescription(request.description());
    entity.setCategory(request.category());
    entity.setTransactionType(request.transactionType());
    entity.setStatus(request.status());
    entity.setAmount(request.amount());
    // editar redefine o pago conforme o status (parcial só é mantido via pagamento)
    entity.setPaidAmount(request.status() == TransactionStatus.CONCLUIDA ? request.amount() : BigDecimal.ZERO);
    entity.setTransactionDate(request.transactionDate());
    entity.setUpdatedAt(LocalDateTime.now());

    TransactionResponse saved = TransactionResponse.from(transactionRepository.save(entity));
    // aplica o efeito novo e persiste o saldo líquido
    accumulate(deltas, entity, BigDecimal.ONE);
    applyBalanceDeltas(userId, deltas);
    return saved;
  }

  /**
   * Registra um pagamento (total ou parcial) e reflete no saldo. {@code valor} nulo quita o
   * restante. Atualiza o pago acumulado e o status (PARCIAL enquanto faltar, CONCLUIDA ao quitar),
   * marcando a data do último pagamento como hoje.
   */
  @Transactional
  public TransactionResponse pay(UUID id, BigDecimal valor) {
    UUID userId = securityContextService.getUserId();
    TransactionEntity entity = transactionRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new BusinessException("Transação não encontrada", HttpStatus.NOT_FOUND));

    BigDecimal jaPago = entity.getPaidAmount() != null ? entity.getPaidAmount() : BigDecimal.ZERO;
    BigDecimal restante = entity.getAmount().subtract(jaPago);
    if (restante.signum() <= 0) {
      return TransactionResponse.from(entity); // já quitada
    }
    BigDecimal pagamento = (valor == null || valor.compareTo(restante) >= 0) ? restante : valor;

    // reverte o efeito do pago anterior, atualiza, e aplica o novo — delta líquido = o pagamento
    Map<UUID, BigDecimal> deltas = new HashMap<>();
    accumulate(deltas, entity, BigDecimal.ONE.negate());

    BigDecimal novoPago = jaPago.add(pagamento);
    entity.setPaidAmount(novoPago);
    entity.setStatus(novoPago.compareTo(entity.getAmount()) >= 0
        ? TransactionStatus.CONCLUIDA
        : TransactionStatus.PARCIAL);
    entity.setTransactionDate(LocalDate.now());
    entity.setUpdatedAt(LocalDateTime.now());

    TransactionResponse saved = TransactionResponse.from(transactionRepository.save(entity));
    accumulate(deltas, entity, BigDecimal.ONE);
    applyBalanceDeltas(userId, deltas);
    return saved;
  }

  @Transactional
  public void delete(UUID id) {
    UUID userId = securityContextService.getUserId();
    TransactionEntity entity = transactionRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new BusinessException("Transação não encontrada", HttpStatus.NOT_FOUND));

    // apagar uma parcela remove a compra parcelada inteira (parcelas são de cartão: não mexem no saldo)
    if (entity.getInstallmentGroupId() != null) {
      transactionRepository.deleteAll(
          transactionRepository.findByInstallmentGroupIdAndUserId(entity.getInstallmentGroupId(), userId));
      return;
    }

    // reverte o efeito da transação no saldo da conta
    Map<UUID, BigDecimal> deltas = new HashMap<>();
    accumulate(deltas, entity, BigDecimal.ONE.negate());
    applyBalanceDeltas(userId, deltas);

    transactionRepository.delete(entity);
  }

  /**
   * Impacto de uma transação no saldo da conta = o valor efetivamente PAGO (cobre pagamento total e
   * parcial). Só conta quando ligada a uma conta, fora de cartão e com data até hoje; cartão entra via
   * fatura e datas futuras são apenas projeção. {@code sign} = +1 para aplicar, -1 para reverter.
   */
  private void accumulate(Map<UUID, BigDecimal> deltas, TransactionEntity t, BigDecimal sign) {
    if (t.getAccount() == null
        || t.getCard() != null
        || t.getTransactionDate().isAfter(LocalDate.now())) {
      return;
    }
    BigDecimal pago = t.getPaidAmount() != null ? t.getPaidAmount() : BigDecimal.ZERO;
    if (pago.signum() == 0) {
      return;
    }
    BigDecimal signed = t.getTransactionType() == TransactionType.ENTRADA ? pago : pago.negate();
    deltas.merge(t.getAccount().getId(), signed.multiply(sign), BigDecimal::add);
  }

  private void applyBalanceDeltas(UUID userId, Map<UUID, BigDecimal> deltas) {
    deltas.forEach((accountId, delta) -> {
      if (delta.signum() == 0) {
        return;
      }
      accountRepository.findByIdAndUserId(accountId, userId).ifPresent(account -> {
        account.setBalance(account.getBalance().add(delta));
        accountRepository.save(account);
      });
    });
  }
}
