package com.financaspessoais.api.domain.account;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<AccountEntity, UUID> {
  List<AccountEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
  Optional<AccountEntity> findByIdAndUserId(UUID id, UUID userId);
}
