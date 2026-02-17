package com.financaspessoais.api.domain.setting;

import java.util.UUID;

public record UserProfileResponse(
    UUID userId,
    String fullName,
    String email,
    boolean monthlySummary,
    boolean lowBalanceAlert,
    boolean securityAlert,
    String theme
) {}
