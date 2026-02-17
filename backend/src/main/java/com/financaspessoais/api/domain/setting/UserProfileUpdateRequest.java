package com.financaspessoais.api.domain.setting;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserProfileUpdateRequest(
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 120, message = "Nome deve ter até 120 caracteres")
    String fullName,

    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    String email,

    boolean monthlySummary,
    boolean lowBalanceAlert,
    boolean securityAlert,
    String theme
) {}
