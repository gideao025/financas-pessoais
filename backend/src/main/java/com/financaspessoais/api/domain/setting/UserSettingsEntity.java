package com.financaspessoais.api.domain.setting;

import com.financaspessoais.api.domain.user.UserEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsEntity {

  @Id
  private UUID userId;

  @MapsId
  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private UserEntity user;

  @Column(name = "monthly_summary", nullable = false)
  private boolean monthlySummary;

  @Column(name = "low_balance_alert", nullable = false)
  private boolean lowBalanceAlert;

  @Column(name = "security_alert", nullable = false)
  private boolean securityAlert;

  @Column(nullable = false)
  private String theme;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
