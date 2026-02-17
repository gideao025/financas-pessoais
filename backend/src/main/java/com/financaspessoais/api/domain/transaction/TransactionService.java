package com.financaspessoais.api.domain.transaction;

import com.financaspessoais.api.common.BusinessException;
import com.financaspessoais.api.domain.account.AccountEntity;
import com.financaspessoais.api.domain.account.AccountRepository;
import com.financaspessoais.api.domain.card.CardEntity;
import com.financaspessoais.api.domain.card.CardRepository;
import com.financaspessoais.api.domain.user.UserEntity;
import com.financaspessoais.api.domain.user.UserRepository;
import com.financaspessoais.api.security.SecurityContextService;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

  @Transactional
  public void delete(UUID id) {
    UUID userId = securityContextService.getUserId();
    TransactionEntity entity = transactionRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new BusinessException("Transação não encontrada", HttpStatus.NOT_FOUND));
    transactionRepository.delete(entity);
  }
}
