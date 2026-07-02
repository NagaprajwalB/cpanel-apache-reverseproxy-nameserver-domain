package com.apphox.ashvayana.controllers;

import com.apphox.ashvayana.dtos.ApiResponse;
import com.apphox.ashvayana.dtos.ProjectDto;
import com.apphox.ashvayana.entities.Project;
import com.apphox.ashvayana.services.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Project>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Project> projects = projectService.findAll(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Projects fetched successfully", projects));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Project fetched", projectService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Project>> create(@Valid @RequestBody ProjectDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created", projectService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> update(@PathVariable Long id, @Valid @RequestBody ProjectDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Project updated", projectService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted", null));
    }
}
