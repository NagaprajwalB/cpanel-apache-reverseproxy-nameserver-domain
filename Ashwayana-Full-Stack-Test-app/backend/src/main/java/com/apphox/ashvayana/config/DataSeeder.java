package com.apphox.ashvayana.config;

import com.apphox.ashvayana.entities.Role;
import com.apphox.ashvayana.entities.User;
import com.apphox.ashvayana.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        userRepository.findByEmail("admin@ashvayana.com").ifPresentOrElse(
            user -> {
                user.setPassword(passwordEncoder.encode("admin123"));
                user.setActive(true);
                user.setRole(Role.SUPER_ADMIN);
                userRepository.save(user);
                System.out.println("Super Admin user updated/reset successfully.");
            },
            () -> {
                User superAdmin = User.builder()
                        .name("Super Admin")
                        .email("admin@ashvayana.com")
                        .password(passwordEncoder.encode("admin123"))
                        .role(Role.SUPER_ADMIN)
                        .active(true)
                        .build();
                userRepository.save(superAdmin);
                System.out.println("Super Admin user created successfully.");
            }
        );
    }
}
