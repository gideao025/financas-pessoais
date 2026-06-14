package com.financaspessoais.api.domain.recurrence;

import com.financaspessoais.api.common.BusinessException;
import com.financaspessoais.api.domain.account.AccountEntity;
import com.financaspessoais.api.domain.account.AccountRepository;
import com.financaspessoais.api.domain.user.UserEntity;
import com.financaspessoais.api.domain.user.UserRepository;
import com.financaspessoais.api.security.SecurityContextService;
import java.time.LocalDateTime;
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

  private AccountEntity resolveAccount(UUID accountId, UUID userId) {
    if (accountId == null) {
      return null;
    }
    return accountRepository.findByIdAndUserId(accountId, userId)
        .orElseThrow(() -> new BusinessException("Conta não encontrada", HttpStatus.NOT_FOUND));
  }
}
