package com.financaspessoais.api.domain.setting;

import com.financaspessoais.api.common.BusinessException;
import com.financaspessoais.api.domain.user.UserEntity;
import com.financaspessoais.api.domain.user.UserRepository;
import com.financaspessoais.api.security.SecurityContextService;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsService {

  private final UserRepository userRepository;
  private final UserSettingsRepository userSettingsRepository;
  private final SecurityContextService securityContextService;

  public UserProfileResponse getProfile() {
    UUID userId = securityContextService.getUserId();
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));

    UserSettingsEntity settings = userSettingsRepository.findByUserId(userId)
        .orElseThrow(() -> new BusinessException("Configurações não encontradas", HttpStatus.NOT_FOUND));

    return new UserProfileResponse(
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        settings.isMonthlySummary(),
        settings.isLowBalanceAlert(),
        settings.isSecurityAlert(),
        settings.getTheme());
  }

  @Transactional
  public UserProfileResponse updateProfile(UserProfileUpdateRequest request) {
    UUID userId = securityContextService.getUserId();
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));

    UserSettingsEntity settings = userSettingsRepository.findByUserId(userId)
        .orElseThrow(() -> new BusinessException("Configurações não encontradas", HttpStatus.NOT_FOUND));

    user.setFullName(request.fullName());
    user.setEmail(request.email().toLowerCase());
    user.setUpdatedAt(LocalDateTime.now());

    settings.setMonthlySummary(request.monthlySummary());
    settings.setLowBalanceAlert(request.lowBalanceAlert());
    settings.setSecurityAlert(request.securityAlert());
    settings.setTheme(request.theme() == null || request.theme().isBlank() ? "light" : request.theme());
    settings.setUpdatedAt(LocalDateTime.now());

    userRepository.save(user);
    userSettingsRepository.save(settings);

    return getProfile();
  }
}
