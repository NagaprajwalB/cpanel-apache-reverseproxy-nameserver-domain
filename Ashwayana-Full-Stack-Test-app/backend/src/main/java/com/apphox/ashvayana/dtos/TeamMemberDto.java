package com.apphox.ashvayana.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDto {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    private String designation;
    private String bio;
    private String imageUrl;
    private String email;
    private String phone;
    private String linkedin;
    private Integer displayOrder;
    private Boolean active;
}
