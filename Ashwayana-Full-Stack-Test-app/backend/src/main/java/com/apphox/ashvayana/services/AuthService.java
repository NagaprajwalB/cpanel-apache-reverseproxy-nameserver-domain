package com.apphox.ashvayana.services;

import com.apphox.ashvayana.dtos.AuthResponse;
import com.apphox.ashvayana.dtos.LoginRequest;
import com.apphox.ashvayana.dtos.UserDto;
import com.apphox.ashvayana.entities.User;
import com.apphox.ashvayana.repositories.UserRepository;
import com.apphox.ashvayana.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse authenticate(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.isActive())
                .createdDate(user.getCreatedDate())
                .build();

        return AuthResponse.builder()
                .token(jwtToken)
                .user(userDto)
                .build();
    }
}
