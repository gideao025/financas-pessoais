package com.financaspessoais.api.domain.recurrence;

import com.financaspessoais.api.common.BusinessException;
import com.financaspessoais.api.domain.account.AccountEntity;
import com.financaspessoais.api.domain.account.AccountRepository;
import com.financaspessoais.api.domain.transaction.TransactionEntity;
import com.financaspessoais.api.domain.transaction.TransactionRepository;
import com.financaspessoais.api.domain.transaction.TransactionResponse;
import com.financaspessoais.api.domain.transaction.TransactionStatus;
import com.financaspessoais.api.domain.user.UserEntity;
import com.financaspessoais.api.domain.user.UserRepository;
import com.financaspessoais.api.security.SecurityContextService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecurrenceService {

  private final RecurrenceRepository recurrenceRepository;
  private final AccountRepository accountRepository;
  private final UserRepository userRepository;
  private final TransactionRepository transactionRepository;
  private final SecurityContextService securityContextService;

  public List<RecurrenceResponse> listMine() {
    UUID userId = securityContextService.getUserId();
    return recurrenceRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(RecurrenceResponse::from)
        .toList();
  }

  @Transactional
  public RecurrenceResponse create(RecurrenceRequest request) {
    UUID userId = securityContextService.getUserId();
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));

    LocalDateTime now = LocalDateTime.now();
    RecurrenceEntity entity = RecurrenceEntity.builder()
        .id(UUID.randomUUID())
        .user(user)
        .account(resolveAccount(request.accountId(), userId))
        .description(request.description())
        .category(request.category())
        .transactionType(request.transactionType())
        .amount(request.amount())
        .dayOfMonth(request.dayOfMonth())
        .active(true)
        .createdAt(now)
        .updatedAt(now)
        .build();

    return RecurrenceResponse.from(recurrenceRepository.save(entity));
  }

  @Transactional
  public RecurrenceResponse update(UUID id, RecurrenceRequest request) {
    UUID userId = securityContextService.getUserId();
    RecurrenceEntity entity = recurrenceRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new BusinessException("Recorrência não encontrada", HttpStatus.NOT_FOUND));

    entity.setAccount(resolveAccount(request.accountId(), userId));
    entity.setDescription(request.description());
    entity.setCategory(request.category());
    entity.setTransactionType(request.transactionType());
    entity.setAmount(request.amount());
    entity.setDayOfMonth(request.dayOfMonth());
    entity.setActive(request.active());
    entity.setUpdatedAt(LocalDateTime.now());

    return RecurrenceResponse.from(recurrenceRepository.save(entity));
  }

  @Transactional
  public void delete(UUID id) {
    UUID userId = securityContextService.getUserId();
    RecurrenceEntity entity = recurrenceRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new BusinessException("Recorrência não encontrada", HttpStatus.NOT_FOUND));
    recurrenceRepository.delete(entity);
  }

  /**
   * Gera (sob demanda, idempotente) as contas fixas do mês: uma transação PENDENTE por recorrência
   * ativa que ainda não tenha sido materializada naquela competência (YYYY-MM). Retorna as criadas.
   */
  @Transactional
  public List<TransactionResponse> generateForMonth(String month) {
    UUID userId = securityContextService.getUserId();
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));

    YearMonth ym = parseMonth(month);
    String competence = ym.toString();
    LocalDateTime now = LocalDateTime.now();

    List<TransactionEntity> criadas = new ArrayList<>();
    for (RecurrenceEntity r : recurrenceRepository.findByUserIdAndActiveTrue(userId)) {
      if (transactionRepository.existsByUserIdAndRecurrenceIdAndCompetence(userId, r.getId(), competence)) {
        continue;
      }
      LocalDate due = ym.atDay(Math.min(r.getDayOfMonth(), ym.lengthOfMonth()));
      criadas.add(TransactionEntity.builder()
          .id(UUID.randomUUID())
          .user(user)
          .account(r.getAccount())
          .card(null)
          .description(r.getDescription())
          .category(r.getCategory())
          .transactionType(r.getTransactionType())
          .status(TransactionStatus.PENDENTE)
          .amount(r.getAmount())
          .transactionDate(due)
          .dueDate(due)
          .competence(competence)
          .recurrenceId(r.getId())
          .createdAt(now)
          .updatedAt(now)
          .build());
    }

    return transactionRepository.saveAll(criadas).stream().map(TransactionResponse::from).toList();
  }

  private YearMonth parseMonth(String month) {
    if (month == null || month.isBlank()) {
      return YearMonth.now();
    }
    try {
      return YearMonth.parse(month);
    } catch (RuntimeException ex) {
      return YearMonth.now();
    }
  }

  private AccountEntity resolveAccount(UUID accountId, UUID userId) {
    if (accountId == null) {
      return null;
    }
    return accountRepository.findByIdAndUserId(accountId, userId)
        .orElseThrow(() -> new BusinessException("Conta não encontrada", HttpStatus.NOT_FOUND));
  }
}
