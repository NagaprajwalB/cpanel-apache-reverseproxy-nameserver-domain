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
public class TestimonialDto {
    private Long id;

    @NotBlank(message = "Author name is required")
    private String authorName;

    private String authorDesignation;
    private String authorImage;
    private String content;
    private Integer rating;
    private String propertyName;
    private Boolean active;
}
