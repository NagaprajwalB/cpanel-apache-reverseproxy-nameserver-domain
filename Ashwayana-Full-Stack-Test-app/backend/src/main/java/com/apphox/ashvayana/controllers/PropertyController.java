package com.apphox.ashvayana.controllers;

import com.apphox.ashvayana.dtos.ApiResponse;
import com.apphox.ashvayana.dtos.PropertyDto;
import com.apphox.ashvayana.entities.Property;
import com.apphox.ashvayana.services.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Property>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Property> properties = propertyService.findAll(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Properties fetched successfully", properties));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Property>> getById(@PathVariable Long id) {
        Property property = propertyService.findById(id);
        return ResponseEntity.ok(ApiResponse.success("Property fetched successfully", property));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Property>> create(@Valid @RequestBody PropertyDto dto) {
        Property property = propertyService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Property created successfully", property));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Property>> update(
            @PathVariable Long id, @Valid @RequestBody PropertyDto dto) {
        Property property = propertyService.update(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Property updated successfully", property));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        propertyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Property deleted successfully", null));
    }
}
