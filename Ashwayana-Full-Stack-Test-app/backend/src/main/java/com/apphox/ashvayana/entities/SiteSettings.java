package com.apphox.ashvayana.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "site_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String companyName;
    private String email;
    private String phone;
    private String address;
    
    @Column(columnDefinition = "TEXT")
    private String googleMapsLink;
    
    private String facebookUrl;
    private String instagramUrl;
    private String linkedinUrl;
    private String youtubeUrl;
    
    private String footerText;
    
    private String logoUrl;
    private String faviconUrl;
}
