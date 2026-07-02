package com.apphox.ashvayana.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "property_locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "property_id", nullable = false)
    @JsonIgnore
    private Property property;

    private String address;
    private String area;
    private String city;
    private String state;
    private String pincode;
    
    private Double latitude;
    private Double longitude;
    
    @Column(columnDefinition = "TEXT")
    private String googleMapUrl;
}
