package com.financaspessoais.api.domain.setting;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

  private final SettingsService settingsService;

  @GetMapping("/profile")
  public UserProfileResponse getProfile() {
    return settingsService.getProfile();
  }

  @PutMapping("/profile")
  public UserProfileResponse updateProfile(@Valid @RequestBody UserProfileUpdateRequest request) {
    return settingsService.updateProfile(request);
  }
}
