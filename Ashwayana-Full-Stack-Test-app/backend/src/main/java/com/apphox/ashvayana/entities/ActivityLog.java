package com.apphox.ashvayana.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String action; // e.g., "Property Created", "User Login"

    private String entityType; // e.g., "Property", "User"
    
    private Long entityId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;
}
