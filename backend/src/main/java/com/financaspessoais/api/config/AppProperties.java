package com.financaspessoais.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public record AppProperties(String secret, long accessExpirationMs, long refreshExpirationMs) {}
