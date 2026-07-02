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
public class AmenityDto {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    private String icon;
    private String description;
    private Boolean active;
}
