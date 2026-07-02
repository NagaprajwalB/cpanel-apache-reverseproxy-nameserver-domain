package com.apphox.ashvayana.controllers;

import com.apphox.ashvayana.dtos.ApiResponse;
import com.apphox.ashvayana.dtos.TestimonialDto;
import com.apphox.ashvayana.entities.Testimonial;
import com.apphox.ashvayana.services.TestimonialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/testimonials")
@RequiredArgsConstructor
public class TestimonialController {

    private final TestimonialService testimonialService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Testimonial>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Testimonials fetched", testimonialService.findAll(PageRequest.of(page, size))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Testimonial>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Testimonial fetched", testimonialService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Testimonial>> create(@Valid @RequestBody TestimonialDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Testimonial created", testimonialService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Testimonial>> update(@PathVariable Long id, @Valid @RequestBody TestimonialDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Testimonial updated", testimonialService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        testimonialService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Testimonial deleted", null));
    }
}
