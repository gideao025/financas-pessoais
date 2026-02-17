package com.financaspessoais.api.auth;

import com.financaspessoais.api.common.BusinessException;
import com.financaspessoais.api.config.AppProperties;
import com.financaspessoais.api.domain.setting.UserSettingsEntity;
import com.financaspessoais.api.domain.setting.UserSettingsRepository;
import com.financaspessoais.api.domain.user.RefreshTokenEntity;
import com.financaspessoais.api.domain.user.RefreshTokenRepository;
import com.financaspessoais.api.domain.user.UserEntity;
import com.financaspessoais.api.domain.user.UserRepository;
import com.financaspessoais.api.jwt.JwtService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final UserSettingsRepository userSettingsRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final AppProperties appProperties;

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email().toLowerCase())) {
      throw new BusinessException("E-mail já cadastrado", HttpStatus.CONFLICT);
    }

    LocalDateTime now = LocalDateTime.now();
    UserEntity user = UserEntity.builder()
        .id(UUID.randomUUID())
        .fullName(request.fullName())
        .email(request.email().toLowerCase())
        .passwordHash(passwordEncoder.encode(request.password()))
        .createdAt(now)
        .updatedAt(now)
        .build();

    userRepository.save(user);

    userSettingsRepository.save(UserSettingsEntity.builder()
        .userId(user.getId())
        .user(user)
        .monthlySummary(true)
        .lowBalanceAlert(false)
        .securityAlert(true)
        .theme("light")
        .updatedAt(now)
        .build());

    return issueTokens(user);
  }

  public AuthResponse login(LoginRequest request) {
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password()));

    UserEntity user = userRepository.findByEmail(request.email().toLowerCase())
        .orElseThrow(() -> new BusinessException("Credenciais inválidas", HttpStatus.UNAUTHORIZED));

    return issueTokens(user);
  }

  public AuthResponse refresh(RefreshTokenRequest request) {
    String tokenHash = sha256(request.refreshToken());

    RefreshTokenEntity savedToken = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
        .orElseThrow(() -> new BusinessException("Refresh token inválido", HttpStatus.UNAUTHORIZED));

    if (savedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
      savedToken.setRevoked(true);
      refreshTokenRepository.save(savedToken);
      throw new BusinessException("Refresh token expirado", HttpStatus.UNAUTHORIZED);
    }

    String subject = savedToken.getUser().getEmail();
    if (!jwtService.isTokenValid(request.refreshToken(), subject)) {
      throw new BusinessException("Refresh token inválido", HttpStatus.UNAUTHORIZED);
    }

    savedToken.setRevoked(true);
    refreshTokenRepository.save(savedToken);

    return issueTokens(savedToken.getUser());
  }

  private AuthResponse issueTokens(UserEntity user) {
    String accessToken = jwtService.generateAccessToken(user.getEmail());
    String refreshToken = jwtService.generateRefreshToken(user.getEmail());

    refreshTokenRepository.save(RefreshTokenEntity.builder()
        .id(UUID.randomUUID())
        .user(user)
        .tokenHash(sha256(refreshToken))
        .expiresAt(LocalDateTime.now().plusMillis(appProperties.refreshExpirationMs()))
        .revoked(false)
        .createdAt(LocalDateTime.now())
        .build());

    return new AuthResponse(accessToken, refreshToken, appProperties.accessExpirationMs(), "Bearer");
  }

  private String sha256(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 indisponível", ex);
    }
  }
}
