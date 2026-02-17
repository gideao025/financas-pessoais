package com.financaspessoais.api.security;

import com.financaspessoais.api.common.BusinessException;
import com.financaspessoais.api.domain.user.UserEntity;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityContextService {

  public UUID getUserId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof UserEntity user)) {
      throw new BusinessException("Usuário não autenticado", HttpStatus.UNAUTHORIZED);
    }
    return user.getId();
  }
}
