package com.apphox.ashvayana.controllers;

import com.apphox.ashvayana.dtos.ApiResponse;
import com.apphox.ashvayana.entities.SiteSettings;
import com.apphox.ashvayana.repositories.SiteSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SiteSettingsController {

    private final SiteSettingsRepository siteSettingsRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<SiteSettings>> get() {
        Optional<SiteSettings> settings = siteSettingsRepository.findAll()
                .stream().findFirst();
        return settings
                .map(s -> ResponseEntity.ok(ApiResponse.success("Settings fetched", s)))
                .orElse(ResponseEntity.ok(ApiResponse.success("No settings found", null)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SiteSettings>> save(@RequestBody SiteSettings settings) {
        // Upsert pattern: only one settings record allowed
        Optional<SiteSettings> existing = siteSettingsRepository.findAll().stream().findFirst();
        existing.ifPresent(s -> settings.setId(s.getId()));
        SiteSettings saved = siteSettingsRepository.save(settings);
        return ResponseEntity.ok(ApiResponse.success("Settings saved", saved));
    }
}
