package com.apphox.ashvayana.repositories;

import com.apphox.ashvayana.entities.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property, Long> {
    Optional<Property> findBySlug(String slug);
}
