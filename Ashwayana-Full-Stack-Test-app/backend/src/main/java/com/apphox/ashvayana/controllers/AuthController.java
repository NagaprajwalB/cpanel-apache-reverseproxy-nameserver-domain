package com.apphox.ashvayana.controllers;

import com.apphox.ashvayana.dtos.ApiResponse;
import com.apphox.ashvayana.dtos.AuthResponse;
import com.apphox.ashvayana.dtos.LoginRequest;
import com.apphox.ashvayana.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticate(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse authResponse = authService.authenticate(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }
}
