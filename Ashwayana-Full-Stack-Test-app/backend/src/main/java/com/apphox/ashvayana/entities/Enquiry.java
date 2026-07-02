package com.apphox.ashvayana.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "enquiries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @ManyToOne
    @JoinColumn(name = "property_id")
    private Property property;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private String status; // New, Contacted, Closed

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdDate;
}
