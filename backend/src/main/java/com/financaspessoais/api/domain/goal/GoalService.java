package com.financaspessoais.api.domain.goal;

import com.financaspessoais.api.common.BusinessException;
import com.financaspessoais.api.domain.user.UserEntity;
import com.financaspessoais.api.domain.user.UserRepository;
import com.financaspessoais.api.security.SecurityContextService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GoalService {

  private final GoalRepository goalRepository;
  private final UserRepository userRepository;
  private final SecurityContextService securityContextService;

  public List<GoalResponse> listMine() {
    UUID userId = securityContextService.getUserId();
    return goalRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
        .map(GoalResponse::from)
        .toList();
  }

  @Transactional
  public GoalResponse create(GoalRequest request) {
    UUID userId = securityContextService.getUserId();
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));

    LocalDateTime now = LocalDateTime.now();
    GoalEntity entity = GoalEntity.builder()
        .id(UUID.randomUUID())
        .user(user)
        .name(request.name())
        .description(request.description())
        .targetAmount(request.targetAmount())
        .currentAmount(request.currentAmount())
        .dueDate(request.dueDate())
        .createdAt(now)
        .updatedAt(now)
        .build();

    return GoalResponse.from(goalRepository.save(entity));
  }

  @Transactional
  public GoalResponse update(UUID id, GoalRequest request) {
    UUID userId = securityContextService.getUserId();

    GoalEntity entity = goalRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new BusinessException("Meta não encontrada", HttpStatus.NOT_FOUND));

    entity.setName(request.name());
    entity.setDescription(request.description());
    entity.setTargetAmount(request.targetAmount());
    entity.setCurrentAmount(request.currentAmount());
    entity.setDueDate(request.dueDate());
    entity.setUpdatedAt(LocalDateTime.now());

    return GoalResponse.from(goalRepository.save(entity));
  }

  @Transactional
  public GoalResponse complete(UUID id) {
    UUID userId = securityContextService.getUserId();

    GoalEntity entity = goalRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new BusinessException("Meta não encontrada", HttpStatus.NOT_FOUND));

    entity.setCurrentAmount(entity.getTargetAmount());
    entity.setUpdatedAt(LocalDateTime.now());

    return GoalResponse.from(goalRepository.save(entity));
  }
}

