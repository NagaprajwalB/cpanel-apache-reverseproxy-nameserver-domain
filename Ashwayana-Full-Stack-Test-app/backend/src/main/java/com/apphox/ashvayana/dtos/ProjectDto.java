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
public class ProjectDto {
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    private String slug;
    private String description;
    private String shortDescription;
    private String location;
    private String status;
    private String thumbnailUrl;
    private String completionYear;
    private Integer totalUnits;
    private Boolean featured;
    private String metaTitle;
    private String metaDescription;
}
