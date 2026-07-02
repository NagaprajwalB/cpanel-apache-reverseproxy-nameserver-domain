package com.apphox.ashvayana.controllers;

import com.apphox.ashvayana.dtos.ApiResponse;
import com.apphox.ashvayana.dtos.AmenityDto;
import com.apphox.ashvayana.entities.Amenity;
import com.apphox.ashvayana.services.AmenityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/amenities")
@RequiredArgsConstructor
public class AmenityController {

    private final AmenityService amenityService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Amenity>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Amenities fetched", amenityService.findAll(PageRequest.of(page, size))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Amenity>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Amenity fetched", amenityService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Amenity>> create(@Valid @RequestBody AmenityDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Amenity created", amenityService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Amenity>> update(@PathVariable Long id, @Valid @RequestBody AmenityDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Amenity updated", amenityService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        amenityService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Amenity deleted", null));
    }
}
