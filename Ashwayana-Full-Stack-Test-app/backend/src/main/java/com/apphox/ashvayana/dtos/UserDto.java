package com.apphox.ashvayana.dtos;

import com.apphox.ashvayana.entities.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private boolean active;
    private LocalDateTime createdDate;
}
