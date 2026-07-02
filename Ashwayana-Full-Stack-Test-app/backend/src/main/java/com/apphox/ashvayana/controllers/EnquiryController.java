package com.apphox.ashvayana.controllers;

import com.apphox.ashvayana.dtos.ApiResponse;
import com.apphox.ashvayana.dtos.EnquiryRequest;
import com.apphox.ashvayana.entities.Enquiry;
import com.apphox.ashvayana.entities.Property;
import com.apphox.ashvayana.repositories.EnquiryRepository;
import com.apphox.ashvayana.repositories.PropertyRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/enquiries")
@RequiredArgsConstructor
public class EnquiryController {

    private final EnquiryRepository enquiryRepository;
    private final PropertyRepository propertyRepository;


    @GetMapping
    public ResponseEntity<ApiResponse<Page<Enquiry>>> getAll(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size) {
        Page<Enquiry> enquiries = enquiryRepository.findAll(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Enquiries fetched", enquiries));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Enquiry>> create(@Valid @RequestBody EnquiryRequest request) {
        Property property = null;
        if (request.getPropertyId() != null) {
            property = propertyRepository.findById(request.getPropertyId()).orElse(null);
        }

        Enquiry enquiry = Enquiry.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .property(property)
                .message(request.getMessage())
                .status(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus() : "New")
                .build();

        Enquiry saved = enquiryRepository.save(enquiry);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Enquiry submitted successfully", saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Enquiry>> getById(@PathVariable Long id) {
        return enquiryRepository.findById(id)
                .map(e -> ResponseEntity.ok(ApiResponse.success("Enquiry fetched", e)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Enquiry>> updateStatus(@PathVariable Long id,
                                                    @RequestParam String status) {
        return enquiryRepository.findById(id)
                .map(e -> {
                    e.setStatus(status);
                    enquiryRepository.save(e);
                    return ResponseEntity.ok(ApiResponse.success("Status updated", e));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        enquiryRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Enquiry deleted", null));
    }

}
