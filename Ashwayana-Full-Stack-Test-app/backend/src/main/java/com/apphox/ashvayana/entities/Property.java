package com.apphox.ashvayana.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "properties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    private BigDecimal price;
    private String priceLabel;

    @Enumerated(EnumType.STRING)
    private PropertyType type;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.UPCOMING;

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

    @Column(name = "is_featured")
    @Builder.Default
    private boolean featured = false;

    // SEO Fields
    private String metaTitle;
    private String metaDescription;
    private String keywords;
    private String openGraphImage;
    private String brochureUrl;
    private String videoUrl;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    private PropertyLocation location;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PropertyImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<NearbyLocation> nearbyLocations = new ArrayList<>();

    @ManyToMany
    @JoinTable(
        name = "property_amenities",
        joinColumns = @JoinColumn(name = "property_id"),
        inverseJoinColumns = @JoinColumn(name = "amenity_id")
    )
    @Builder.Default
    private List<Amenity> amenities = new ArrayList<>();
}
