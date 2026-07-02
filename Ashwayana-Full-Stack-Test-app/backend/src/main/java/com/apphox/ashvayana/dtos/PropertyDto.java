package com.apphox.ashvayana.dtos;

import com.apphox.ashvayana.entities.PropertyStatus;
import com.apphox.ashvayana.entities.PropertyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyDto {
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    private String slug;
    private String description;

    @NotNull(message = "Price is required")
    private BigDecimal price;

    private String priceLabel;
    private PropertyType type;
    private PropertyStatus status;

    private String address;
    private String city;
    private String state;
    private String pincode;

    private Integer bedrooms;
    private Integer bathrooms;
    private Double area;
    private String areaUnit;
    private Integer floor;
    private Integer totalFloors;
    private Integer parkingSpaces;

    private String thumbnailUrl;

    private String metaTitle;
    private String metaDescription;
    private String keywords;
    private String openGraphImage;
    private String brochureUrl;
    private String videoUrl;

    private Boolean featured;

    // Nested
    private Long locationId;
    private List<Long> amenityIds;
    private List<String> imageUrls;
}
