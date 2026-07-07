package com.financaspessoais.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    // Autenticação é por token Bearer (sem cookie), então CORS não é fronteira de
    // segurança aqui. Padrões cobrem dev local, a LAN e o domínio atrás do proxy.
    registry.addMapping("/api/**")
        .allowedOriginPatterns(
            "http://localhost:4200",
            "http://localhost:9090",
            "http://192.168.*.*:9090",
            "https://finance.gideaolucas.com.br")
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        .allowedHeaders("*");
  }
}
