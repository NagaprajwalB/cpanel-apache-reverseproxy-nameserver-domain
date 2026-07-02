package com.apphox.ashvayana.controllers;

import com.apphox.ashvayana.dtos.ApiResponse;
import com.apphox.ashvayana.dtos.MaterialDto;
import com.apphox.ashvayana.entities.Material;
import com.apphox.ashvayana.services.MaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Material>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Materials fetched", materialService.findAll(PageRequest.of(page, size))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Material>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Material fetched", materialService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Material>> create(@Valid @RequestBody MaterialDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Material created", materialService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Material>> update(@PathVariable Long id, @Valid @RequestBody MaterialDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Material updated", materialService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        materialService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Material deleted", null));
    }
}
