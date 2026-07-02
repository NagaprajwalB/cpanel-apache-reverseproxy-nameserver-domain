package com.apphox.ashvayana.controllers;

import com.apphox.ashvayana.dtos.ApiResponse;
import com.apphox.ashvayana.entities.Role;
import com.apphox.ashvayana.entities.User;
import com.apphox.ashvayana.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAll() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Users fetched", users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> ResponseEntity.ok(ApiResponse.success("User fetched", u)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found", null)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<User>> create(@RequestBody CreateUserRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Email already in use", null));
        }
        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.valueOf(request.role()))
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created", userRepository.save(user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> update(
            @PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return userRepository.findById(id).map(user -> {
            user.setName(request.name());
            user.setRole(Role.valueOf(request.role()));
            return ResponseEntity.ok(ApiResponse.success("User updated", userRepository.save(user)));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("User not found", null)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found", null));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<User>> toggleActive(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setActive(!user.isActive());
            return ResponseEntity.ok(ApiResponse.success("User status updated", userRepository.save(user)));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("User not found", null)));
    }

    // Record-based request bodies (Java 16+)
    record CreateUserRequest(String name, String email, String password, String role) {}
    record UpdateUserRequest(String name, String role) {}
}
