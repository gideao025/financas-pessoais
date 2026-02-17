package com.financaspessoais.api.domain.card;

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
public class CardService {

  private final CardRepository cardRepository;
  private final AccountRepository accountRepository;
  private final UserRepository userRepository;
  private final SecurityContextService securityContextService;

  public List<CardResponse> listMine() {
    UUID userId = securityContextService.getUserId();
    return cardRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(CardResponse::from).toList();
  }

  @Transactional
  public CardResponse create(CardRequest request) {
    UUID userId = securityContextService.getUserId();
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));

    AccountEntity account = null;
    if (request.accountId() != null) {
      account = accountRepository.findByIdAndUserId(request.accountId(), userId)
          .orElseThrow(() -> new BusinessException("Conta não encontrada", HttpStatus.NOT_FOUND));
    }

    LocalDateTime now = LocalDateTime.now();
    CardEntity entity = CardEntity.builder()
        .id(UUID.randomUUID())
        .user(user)
        .account(account)
        .name(request.name())
        .brand(request.brand())
        .lastFour(request.lastFour())
        .creditLimit(request.creditLimit())
        .usedLimit(request.usedLimit())
        .dueDay(request.dueDay())
        .blocked(request.blocked())
        .createdAt(now)
        .updatedAt(now)
        .build();

    return CardResponse.from(cardRepository.save(entity));
  }

  @Transactional
  public CardResponse toggleBlocked(UUID cardId) {
    UUID userId = securityContextService.getUserId();
    CardEntity entity = cardRepository.findByIdAndUserId(cardId, userId)
        .orElseThrow(() -> new BusinessException("Cartão não encontrado", HttpStatus.NOT_FOUND));

    entity.setBlocked(!entity.isBlocked());
    entity.setUpdatedAt(LocalDateTime.now());
    return CardResponse.from(cardRepository.save(entity));
  }
}
