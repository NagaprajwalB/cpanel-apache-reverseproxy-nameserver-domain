package com.apphox.ashvayana.controllers;

import com.apphox.ashvayana.dtos.ApiResponse;
import com.apphox.ashvayana.dtos.TeamMemberDto;
import com.apphox.ashvayana.entities.TeamMember;
import com.apphox.ashvayana.services.TeamMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/team")
@RequiredArgsConstructor
public class TeamMemberController {

    private final TeamMemberService teamMemberService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TeamMember>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Team members fetched", teamMemberService.findAll(PageRequest.of(page, size))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamMember>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Team member fetched", teamMemberService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeamMember>> create(@Valid @RequestBody TeamMemberDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Team member created", teamMemberService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamMember>> update(@PathVariable Long id, @Valid @RequestBody TeamMemberDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Team member updated", teamMemberService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        teamMemberService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Team member deleted", null));
    }
}
