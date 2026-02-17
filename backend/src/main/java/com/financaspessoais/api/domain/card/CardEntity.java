package com.financaspessoais.api.domain.card;

import com.financaspessoais.api.domain.account.AccountEntity;
import com.financaspessoais.api.domain.user.UserEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cards")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardEntity {

  @Id
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private UserEntity user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "account_id")
  private AccountEntity account;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String brand;

  @Column(name = "last_four", nullable = false)
  private String lastFour;

  @Column(name = "credit_limit", nullable = false)
  private BigDecimal creditLimit;

  @Column(name = "used_limit", nullable = false)
  private BigDecimal usedLimit;

  @Column(name = "due_day", nullable = false)
  private Integer dueDay;

  @Column(nullable = false)
  private boolean blocked;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
