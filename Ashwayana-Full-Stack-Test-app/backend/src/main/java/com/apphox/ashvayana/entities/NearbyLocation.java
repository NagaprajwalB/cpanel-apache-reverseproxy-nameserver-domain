package com.apphox.ashvayana.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "nearby_locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NearbyLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "property_id", nullable = false)
    @JsonIgnore
    private Property property;

    @Column(nullable = false)
    private String title; // e.g., "Airport", "School"

    @Column(nullable = false)
    private String distance; // e.g., "8 KM"
}
