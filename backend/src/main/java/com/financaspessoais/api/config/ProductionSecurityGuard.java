package com.financaspessoais.api.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Em produção (perfil {@code prd}), recusa iniciar se o JWT_SECRET ainda for o valor default —
 * evita subir a aplicação exposta com um segredo conhecido (tokens forjáveis).
 */
@Component
@Profile("prd")
@RequiredArgsConstructor
public class ProductionSecurityGuard {

  private final AppProperties appProperties;

  @PostConstruct
  void verificarSegredo() {
    String secret = appProperties.secret();
    if (secret == null || secret.isBlank() || secret.startsWith("change-me")) {
      throw new IllegalStateException(
          "JWT_SECRET ausente ou default em producao (perfil prd). "
              + "Defina um segredo forte via variavel de ambiente JWT_SECRET.");
    }
  }
}
