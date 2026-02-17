package com.financaspessoais.api.auth;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    long expiresIn,
    String tokenType
) {}
