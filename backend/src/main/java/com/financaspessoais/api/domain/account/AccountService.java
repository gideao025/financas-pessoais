package com.financaspessoais.api.domain.account;

import com.financaspessoais.api.common.BusinessException;
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
public class AccountService {

  private final AccountRepository accountRepository;
  private final UserRepository userRepository;
  private final SecurityContextService securityContextService;

  public List<AccountResponse> listMine() {
    UUID userId = securityContextService.getUserId();
    return accountRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(AccountResponse::from)
        .toList();
  }

  @Transactional
  public AccountResponse create(AccountRequest request) {
    UUID userId = securityContextService.getUserId();
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));

    LocalDateTime now = LocalDateTime.now();
    AccountEntity entity = AccountEntity.builder()
        .id(UUID.randomUUID())
        .user(user)
        .name(request.name())
        .type(request.type())
        .institution(request.institution())
        .balance(request.balance())
        .active(request.active())
        .createdAt(now)
        .updatedAt(now)
        .build();

    return AccountResponse.from(accountRepository.save(entity));
  }

  @Transactional
  public AccountResponse update(UUID id, AccountRequest request) {
    UUID userId = securityContextService.getUserId();

    AccountEntity entity = accountRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new BusinessException("Conta não encontrada", HttpStatus.NOT_FOUND));

    entity.setName(request.name());
    entity.setType(request.type());
    entity.setInstitution(request.institution());
    entity.setBalance(request.balance());
    entity.setActive(request.active());
    entity.setUpdatedAt(LocalDateTime.now());

    return AccountResponse.from(accountRepository.save(entity));
  }
}
